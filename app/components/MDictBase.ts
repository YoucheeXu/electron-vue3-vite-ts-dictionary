// MDictBase.ts
import * as path from "path";
import * as fs from "fs";
import { DictBase } from "./DictBase";
import { MdPakage } from "./MdPakage";

import { RemoveDir } from "../utils/utils";
// import { globalVar } from "../utils/globalInterface";

// read from mdd, mdx
export class MDictBase extends DictBase {
  private _mdx: MdPakage;
  private _mdd?: MdPakage;

  constructor(
    name: string,
    mdxFile: string,
    readonly _passcode?: [string, string],
  ) {
    super(name, mdxFile);

    const filePath = path.dirname(mdxFile);
    const fileName = path.basename(mdxFile, ".mdx");
    const tmpDir = path.join(filePath, fileName);
    this.szTmpDir = tmpDir;
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

    this._mdx = new MdPakage(mdxFile, false, "", this._passcode);

    const mddFile = path.join(filePath, fileName + ".mdd");
    if (fs.existsSync(mddFile) == true) {
      // this._mdd = new MdPakage(mddFile, true, "GB18030", this._passcode);
      this._mdd = new MdPakage(mddFile, true, "UTF-16", this._passcode);
    }
  }

  public async Open() {
    await this._mdx.Open();
    if (this._mdd) {
      await this._mdd.Open();
    }
  }

  public async query_word(word: string): Promise<[number, string]> {
    let datum: string;
    let ret = false;
    const dictFile = path.join(this.szTmpDir, word + ".html");
    let retNum = -1;
    let errMsg = "";
    if (fs.existsSync(dictFile) == true) {
      return Promise.resolve([1, dictFile]);
    } else if (this._mdx.bRecordIn(word)) {
      try {
        [ret, datum] = await this._mdx.ReadRecord(word);

        if (ret) {
          const html = "<!DOCTYPE html><html><body>" + datum + "</body></html>";
          fs.writeFileSync(dictFile, html);
        } else {
          retNum = -1;
          errMsg = `Fail to read ${word} in ${this._szName}.mdx`;
        }

        // let regEx = /src="google-toggle.js" | href="google.css"/g;
        const regexp = /href="(.+?)"/g;
        const matches = datum.matchAll(regexp);
        let srcFile = "";
        for (const match of matches) {
          const src = "\\" + match[1];
          if (this._mdd?.bRecordIn(src)) {
            [ret, datum] = await this._mdd.ReadRecord(src);
            if (ret) {
              srcFile = path.join(this.szTmpDir, src);
              fs.writeFileSync(srcFile, datum);
            } else {
              retNum = -1;
              errMsg = `Fail to read ${src} in ${this._szName}.mdd`;
            }
          } else {
            retNum = -1;
            errMsg = `There is no ${src} in ${this._szName}.mdd`;
          }
        }
        return Promise.resolve([1, dictFile]);
      } catch (e) {
        if (fs.existsSync(dictFile)) {
          fs.unlinkSync(dictFile);
        }
        retNum = -1;
        errMsg = (e as Error).message.replace("<", "").replace(">", "");
      }
    } else {
      retNum = -1;
      errMsg = `${word} isn't in ${this._szName}`;
    }

    return Promise.resolve([retNum, errMsg]);
  }

  public get_wordsLst(word: string, wdMatchLst: string[]): boolean {
    const wordLike = "^" + word + ".*";
    this._mdx.searchFile(wordLike, wdMatchLst, 100);

    if (wdMatchLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public CheckAndAddFile(localFile: string) {
    throw new Error("Don't support to add record: " + localFile);
    return;
  }

  public del_word(word: string): boolean {
    throw new Error("Don't support to delete word: " + word);
    return false;
  }

  public async Close(): Promise<[boolean, string]> {
    let ret1 = true;
    let msg1 = "";

    let ret2 = true;
    let msg2 = "";

    let ret3 = true;
    let msg3 = "";

    [ret1, msg1] = await this._mdx.Close();
    if (this._mdd) {
      [ret2, msg2] = await this._mdd.Close();
    }

    RemoveDir(this.szTmpDir);
    if (fs.existsSync(this.szTmpDir) == false) {
      msg3 = `OK to remove ${this.szTmpDir}`;
    } else {
      msg3 = `Fail to remove ${this.szTmpDir}`;
      ret3 = false;
    }

    const ret = ret1 && ret2 && ret3;
    const msg = `${msg1}; ${msg2}; ${msg3}`;

    return [ret, msg];
  }
}
