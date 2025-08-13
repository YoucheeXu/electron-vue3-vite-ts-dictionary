// GDictBase.ts
import * as path from "path";
import * as fs from "fs";
import { DictBase } from "./DictBase";
import { ZipArchive } from "./ZipArchive";
import { RemoveDir } from "../utils/utils";
// import { globalVar } from "../utils/globalInterface";

export class GDictBase extends DictBase {
  private _dictZip: ZipArchive;
  private _styleZip: ZipArchive;

  constructor(
    name: string,
    dictSrc: string,
    readonly _compression: string,
    readonly _compresslevel: string,
  ) {
    super(name, dictSrc);

    this._dictZip = new ZipArchive(dictSrc, _compression, _compresslevel);

    const filePath = path.dirname(dictSrc);
    const fileName = path.basename(dictSrc, ".zip");

    const tmpDir = path.join(filePath, fileName);

    this.szTmpDir = tmpDir;

    const styleSrc = path.join(filePath, fileName + "-style.zip");
    this._styleZip = new ZipArchive(styleSrc, _compression, _compresslevel);

    const _this = this;
    if (fs.existsSync(_this.szTmpDir) == false) {
      fs.mkdir(_this.szTmpDir, function (error) {
        if (error) {
          console.error(error);
          return false;
        }
        console.log("Success to create folder: " + _this.szTmpDir);
      });
    }
  }

  public async Open() {
    this._styleZip.Open();
    return this._dictZip.Open();
  }

  public async Close(): Promise<[boolean, string]> {
    RemoveDir(this.szTmpDir);
    if (fs.existsSync(this.szTmpDir) == false) {
      return [true, `OK to remove ${this.szTmpDir}`];
    } else {
      return [false, `Fail to remove ${this.szTmpDir}`];
    }
  }

  public async query_word(word: string): Promise<[number, string]> {
    const fileName = word[0] + "/" + word + ".json";
    const dictFile = path.join(this.szTmpDir, word + ".html");
    // let html = "";
    let datum: string | any;
    let ret = false;
    let wordFile = "";
    let retNum = -1;
    let errMsg = "";
    try {
      if (fs.existsSync(dictFile) == true) {
        // html = fs.readFileSync(dictFile, { encoding: 'utf8', flag: 'r' });
        // return Promise.resolve([1, html]);
        return Promise.resolve([1, dictFile]);
      } else if (this._dictZip.bFileIn(fileName)) {
        [ret, datum] = await this._dictZip.readFileAsync(fileName);
        if (!ret) {
          retNum = -1;
          errMsg = `Fail to read ${word} in ${this.szName}`;
        }
      } else {
        wordFile = path.join(this.szTmpDir, word + ".json");
        return Promise.resolve([0, wordFile]);
      }

      const strDatum = String(datum);
      const dictDatum = JSON.parse(strDatum);

      if (dictDatum["ok"]) {
        let info = dictDatum["info"];
        info = String(info).replace(/\\x/g, "\\u00");
        const obj = JSON.parse(info);
        const tabAlign = "\t\t";
        const dict = this.process_primary(tabAlign, obj.primaries);

        const jsName = "google-toggle.js";
        const cssName = "google.css";

        let css = tabAlign + '<link rel="stylesheet" href="../../assets/player.css">' + "\n";
        css += tabAlign + `<link rel="stylesheet" type="text/css" href="${cssName}">`;

        let js = tabAlign + '<script src="../../assets/player.js"></script>' + "\n";
        js += tabAlign + `<script src="${jsName}"></script>`;
        const togeg = tabAlign + '<div id="toggle_example" align="right">- Hide Examples</div>';
        const html = `<!DOCTYPE html>\n<html>\n\t<body>\n${css}\n${js}\n${togeg}\n${dict}\n\t</body>\n</html>`;
        fs.writeFileSync(dictFile, html);

        const jsFile = path.join(this.szTmpDir, jsName);
        if (fs.existsSync(jsFile) == false) {
          if (this._styleZip.bFileIn(jsName)) {
            [ret, datum] = await this._styleZip.readFileAsync(jsName);
            if (!ret) {
              return Promise.resolve([-1, `Fail to read ${jsName} in ${this._styleZip}`]);
            }
            console.log(jsFile);
            fs.writeFileSync(jsFile, String(datum));
          }
        }

        const cssFile = path.join(this.szTmpDir, cssName);
        if (fs.existsSync(cssFile) == false) {
          if (this._styleZip.bFileIn(cssName)) {
            [ret, datum] = await this._styleZip.readFileAsync(cssName);
            if (!ret) {
              return Promise.resolve([-1, `Fail to read ${cssName} in ${this._styleZip}`]);
            }
            console.log(cssFile);
            fs.writeFileSync(cssFile, String(datum));
          }
        }

        return Promise.resolve([1, dictFile]);
        // return Promise.resolve([1, html]);
      } else {
        retNum = -1;
        errMsg = "Fail to read: " + word;
      }
    } catch (e) {
      if (fs.existsSync(wordFile)) {
        fs.unlinkSync(wordFile);
      }
      retNum = -1;
      errMsg = errMsg = (e as Error).message.replace("<", "").replace(">", "");
    }

    return Promise.resolve([retNum, errMsg]);
  }

  // ret: number, typ: number, word: string, msg: string
  public CheckAndAddFile(localFile: string): [number, number, string, string] {
    const word = path.basename(localFile, ".json");
    const fileName = word[0] + "/" + word + ".json";
    // let info = "";
    const _this = this;
    // let gApp = globalVar.app;
    if (fs.existsSync(localFile)) {
      const dict = fs.readFileSync(localFile).toString();
      const inWord = this.GetInWord(dict);

      fs.unlink(localFile, () => {});

      if (inWord != "") {
        if (inWord == word) {
          _this._dictZip.addFile(fileName, dict);
          return [1, 1, word, "OK to download dict of " + word];
        } else {
          return [-1, 1, inWord, `Wrong word: We except '${word}', but we get '${inWord}' at ${this._szName}`];
        }
      } else {
        return [-1, 1, word, `No dict of ${word} in ${this.szName}`];
      }
    } else {
      return [-1, 1, word, `Doesn't exist dict of ${word} at ${this.szName}`];
    }
  }

  private GetInWord(dict: string): string {
    let datum = JSON.parse(dict);

    if (datum["ok"]) {
      let info = datum["info"];
      info = String(info).replace(/\\x/g, "\\u00");
      // info = info.replace('\\', '\\\\');
      try {
        datum = JSON.parse(info);
        if (datum["primaries"][0]["type"] == "headword") {
          return datum["primaries"][0]["terms"][0]["text"];
        }
      } catch (e) {
        const errMsg = (e as Error).message.replace("<", "").replace(">", "");
        console.error(errMsg);
        return "";
      }
    }
    return "";
  }

  public get_wordsLst(word: string, wdMatchLst: string[]): boolean {
    const fileName = word[0] + "/" + word + ".*/.json";
    // print("Going to find: " + fileName)
    this._dictZip.searchFile(fileName, wdMatchLst, 100);

    // for i in range(len(wdMatchLst)){
    for (let i = 0; i < wdMatchLst.length; i++) {
      wdMatchLst[i] = wdMatchLst[i].slice(2, -5);
    }

    if (wdMatchLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public del_word(word: string): boolean {
    const fileName = word[0] + "/" + word + ".json";
    return this._dictZip.delFile(fileName);
  }

  private process_primary(tabAlign: string, dict_primary: any): string {
    const primary = dict_primary;
    let xml = "";
    let html = "";
    let bMeaning = false;
    if (primary instanceof Array) {
      for (const i in primary) {
        const data = primary[i];
        html = this.process_primary(tabAlign, data);
        // console.log("html1: " + html + ";");
        if (html.slice(0, 1) == "<") {
          xml += "\n" + tabAlign;
        }
        xml += html;
      }
    } else if (typeof primary == "object") {
      // let hasChild = false;
      // let hasType = false;
      if (primary.type != undefined) {
        // hasType = true;
        if (primary.type == "container") {
          xml += "" + tabAlign + "<div class = 'wordtype'>" + primary.labels[0].text + ": </div>\n";
          xml += tabAlign + "<div class = '" + primary.type + "1'>\n";
          tabAlign += "\t";
          html = this.process_terms(tabAlign, primary.terms, primary.type);
          if (html.slice(0, 1) == "<") {
            xml += "\n" + tabAlign;
          }
          xml += html;
        } else {
          if (primary.labels != undefined) {
            // if(xml.substr(-1, 1) == ">"){
            // xml += "\n";
            // }
            xml += tabAlign + "<div class = '" + primary.type + "'>";
            tabAlign += "\t";
            xml += "\n" + tabAlign + "<div class = 'labels'>" + primary.labels[0].text + "</div>";
            html = this.process_terms(tabAlign, primary.terms, primary.type);
            if (html.slice(0, 1) == "<") {
              xml += "\n" + tabAlign;
            }
            xml += html;
          } else {
            if (primary.type == "meaning") {
              bMeaning = true;
            }
            if (primary.type == "example" && bMeaning == true) {
              xml += "\n";
              bMeaning = false;
            }
            xml += tabAlign + "<div class = '" + primary.type + "'>";
            tabAlign += "\t";
            html = this.process_terms(tabAlign, primary.terms, primary.type);
            if (html.slice(0, 1) == "<") {
              xml += "\n" + tabAlign;
            }
            // console.log("html4: " + html + ";");
            xml += html;
          }
        }
        if (primary.entries != undefined) {
          html = this.process_primary(tabAlign, primary.entries);
          // console.log("html: " + html + ";");
          // console.log("xml: " + xml + ";");
          // console.log("html2: " + html + ";");
          if (html.slice(0, 1) == "<") {
            xml += "\n" + tabAlign + "Q: ";
          }
          xml += html;
        }
        // xml += tabAlign + "</div>\n";
        tabAlign = tabAlign.slice(0, -1);
        // console.log(xml.substr(-3, 3));
        if (xml.substr(-3, 1) == ">") {
          xml += tabAlign;
        }
        if (xml.substr(-1, 1) == ">") {
          xml += "\n" + tabAlign;
        }
        xml += "</div>\n";
        // tabAlign = tabAlign.slice(0, -2);
      }
    } else if (typeof primary == "string") {
      html = this.process_primary(tabAlign, eval("(" + primary + ")"));
      // console.log("html3: " + html + ";");
      xml += html;
    }
    return xml;
  }

  private process_terms(tabAlign: string, dict_terms: any, type: any): string {
    const terms = dict_terms;
    let xml = "";
    let html = "";
    if (terms instanceof Array) {
      for (const i in terms) {
        const data = terms[i];
        html = this.process_terms(tabAlign, data, type);
        // if(html.slice(0,1) == "<"){
        // xml += "\n" + tabAlign;
        // }
        xml += html;
      }
    } else if (typeof terms == "object") {
      // let hasType = false;
      if (terms.type != undefined) {
        // hasType = true;
        if (terms.type != "text" || type == "headword" || type == "related") {
          if (terms.type == "sound") {
            /*xml += '<div class="'+ terms.type + '">';
                        // xml += terms.text +"</div>";
                        xml += '<embed type="application/x-shockwave-flash" src="SpeakerApp16.swf"' +
                            'width="20" height="20" id="movie28564" name="movie28564" bgcolor="#000000"' +
                            'quality="high" flashlets="sound_name='+ terms.text + '"wmode="transparent">'
                        xml += "</div>"*/
            // alert(terms.text);
            xml += this.getSound(tabAlign, terms.text);
          } else {
            // console.log("P: " + xml)
            // if(xml.substr(-1, 1) == ">"){
            // xml += "\n" + tabAlign;
            // }
            xml += "\n" + tabAlign + "<div class = '" + terms.type + "'>" + terms.text + "</div>";
          }
        } else {
          xml += terms.text;
        }
      }
    }
    return xml;
  }

  /*
    private process_term(dict_terms: any): string {
        let terms = dict_terms

        let xml = "";
        for (let i in terms) {
            let data = terms[i];
            xml += (data.text);
        }
        return xml;
    }
    */

  private getSound(tabAlign: string, url: string): string {
    const sound =
      "\n" +
      tabAlign +
      "<div class = 'sound' id = 'Player'>\n" +
      tabAlign +
      "\t" +
      "<button class = 'jp-play' id = 'playpause' title = 'Play'></button>\n" +
      tabAlign +
      "\t" +
      "<audio id = 'myaudio'>\n" +
      tabAlign +
      "\t" +
      "\t" +
      "<source src = " +
      url +
      " type= 'audio/mpeg'>\n" +
      tabAlign +
      "\t" +
      "\t" +
      "Your browser does not support the audio tag.\n" +
      tabAlign +
      "\t" +
      "</audio>\n" +
      tabAlign +
      "</div>";
    return sound;
  }
}
