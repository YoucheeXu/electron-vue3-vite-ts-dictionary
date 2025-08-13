import * as fs from "fs";
import * as path from "path";

// import { clearInterval } from "timers";

import { ElectronApp } from "./ElectronApp";
// import { DictBase } from "./components/DictBase";
// import { UsrProgress } from "./components/UsrProgress";

export class DictApp extends ElectronApp {
  // private _curDictId: string = "";
  // private _dictSysMenu: string[] | any = [""];

  constructor(startPath: string) {
    super(startPath);
    console.log(`dictApp: ${startPath}`);
  }

  public async Run(argvs: any, bDev: boolean) {
    await super.Run(argvs, bDev);
    // if (argvs.typ == "c") {
    // //     this._curDictId = "dict1";
    // //     dictbase = this.getDictBase(this._curDictId);
    //     const dictbase = this._dictMap.get("Google");
    //     let wordsLst = argvs.word.split(" ");
    //     for (let wd of wordsLst) {
    //         await this.QueryWord2(wd);
    //     }

    //     this.WaitAsyncTasksFnshd(async () => {
    //         await this.Quit();
    //     })
    // }
  }

  public async ReadAndConfigure(binPath: string, cfgFile: string): Promise<boolean> {
    const bRet = await super.ReadAndConfigure(binPath, cfgFile);

    // let usrsCfg = JSON.parse(JSON.stringify(this._cfg['Users']));

    // let defaultUsr = this._cfg.Dictionary.User;

    // for (let usrCfg of usrsCfg) {
    //     // let progressFile = path.join(binPath, usrCfg.Progress).replace(/\\/g, '/');
    //     if (usrCfg.Name == defaultUsr) {
    //         let progressFile = path.join(binPath, usrCfg.Progress);
    //         this._usrProgress = new UsrProgress();
    //         await this._usrProgress.Open(progressFile, "New");
    //         if (await this._usrProgress.ExistTable("New") == false) {
    //             this._usrProgress.NewTable("New");
    //         }
    //         break;
    //     }
    // }
    return bRet;
  }

  public GetTabs(): string[] {
    const tabs: string[] = [...this._dictMap.keys()];
    // console.log(tabs);
    return tabs;
  }

  public async QueryNext(): Promise<[string, string, boolean, string, number]> {
    throw new Error("QueryNext not implemented.");
    // // word = this.NextQueue.Dequeue()
    // word = this.NextStack.Pop()
    // if (this.NextStack.GetSize() == 0){
    //     // self.get_browser().ExecuteFunction("disableButton", "btn_next", true);
    //     this._win.webContents.send("gui", "disableButton", "btn_next", true);
    // }

    // // this.PrevStack.Push(word)
    // // if this.PrevStack.GetSize() == 2:
    //         // self.get_browser().ExecuteFunction("disableButton", "btn_prev", false);

    // // self.get_browser().ExecuteFunction("set_word", word);
    // this._win.webContents.send("gui", "set_word", word);
    // // self.get_browser().ExecuteFunction("query_word");
    // return self.query_word(word, this._curDictId, 1);
  }

  public async QueryPrev(): Promise<[string, string, boolean, string, number]> {
    throw new Error("Method not implemented.");
    // word = this.PrevStack.Pop()
    // if (this.PrevStack.GetSize() == 0){
    //     // self.get_browser().ExecuteFunction("disableButton", "btn_prev", true);
    //     this._win.webContents.send("gui", "disableButton", "btn_prev", true);
    // }

    // // this.NextQueue.Enqueue(word)
    // // if this.NextQueue.GetSize() == 2:
    //         // self.get_browser().ExecuteFunction("disableButton", "btn_next", false);

    // self.get_browser().ExecuteFunction("set_word", word);
    // // self.get_browser().ExecuteFunction("query_word");
    // return self.query_word(word, this._curDictId, -1);
  }

  /*
    // only for command line
    public async QueryWord2(word: string): Promise < void> {
        this.log('info', `word = ${word};`);

        let retDict = -1;
        let dict = "";
        let retAudio = -1;
        let audio = "";

        [retDict, dict] = await dictbase.query_word(word);
        [retAudio, audio] = await this._audioBase.query_audio(word);

        if(retDict < 0) {
            this.Record2File(this._miss_dict, "Dict of " + word + ": " + dict + "\n");
        } else if(retDict == 0) {
            this.log('info', dict);
        }

        if (retAudio < 0) {
            this.Record2File(this._miss_audio, "Audio of " + word + ": " + audio + "\n");
        } else if (retAudio == 0) {
            this.log('info', audio);
        }

        if (retDict < 0 || retAudio < 0) {
            this.Record2File(this._miss_audio, "\n");
        }
    }
    */

  // only for gui
  public async QueryWord(
    word: string,
    tabId: string,
    nDirect: number = 0,
  ): Promise<[string, string, boolean, string, number]> {
    console.debug(`nDirect: ${nDirect}`);
    // Not implemented
    // if (this._lastWord){
    //     if (nDirect == -1){
    //         this.NextStack.Push(this._lastWord)
    //         // this.log('info', "__PrevQueue: %d", this.PrevQueue.GetSize())
    //         if this.NextStack.GetSize() >= 1:
    //             // self.get_browser().ExecuteFunction("disableButton", "btn_next", false);
    //             this._win.webContents.send("gui", "disableButton", "btn_next", false);
    //     }
    //     else{
    //         this.PrevStack.Push(this._lastWord)
    //         // this.log('info', "__PrevQueue: %d", this.PrevQueue.GetSize())
    //         if (this.PrevStack.GetSize() >= 1){
    //             // self.get_browser().ExecuteFunction("disableButton", "btn_prev", false);
    //             this._win.webContents.send("gui", "disableButton", "btn_prev", false);
    //         }
    //     }
    // }
    // this._word = word;
    // if (this._bHomeRdy == false) {
    //     return;
    // }

    if (tabId) {
      // this._curDictId = tabId;
    }

    let retDict = -1;
    let dictURL = "";
    let retAudio = -1;
    let audioURL = "";

    const bNew = false;

    const dictbase = this._dictMap.get(tabId);
    if (dictbase === undefined) {
      throw new Error(`can't find dict ${tabId}`);
      // return [dictURL, audioURL, false, "", -1];
    }

    this.log("info", `word = ${word}, dict = ${dictbase.szName}`);

    [retDict, dictURL] = await dictbase.query_word(word);
    // console.log(`retDict: ${retDict}, dict: ${dict}`);
    [retAudio, audioURL] = await this._audioBase.query_audio(word);

    if (retDict == 0) {
      const dictName = dictbase.szName;
      if (dictbase.download) {
        // this.TriggerDownload(dictbase, word, dict);
      } else {
        const errMsg = `Dict of ${word}: ${dictName} doesn't support to download.\n`;
        this.Record2File(this._miss_dict, errMsg);
        // this.Info(-1, 1, word, errMsg);
      }
      // dictURL = `there is no ${word} in ${dictName}.`;
    }

    if (retDict < 0) {
      this.Record2File(this._miss_dict, dictURL);
    }

    if (retDict <= 0) {
      // this._curWord = "";
      const dictErrFile = path.join(dictbase.szTmpDir, word + "-error.html");
      const html = `<div class="headword">\n\t<div class="text">${dictURL}</div>\n</div>`;
      fs.writeFileSync(dictErrFile, html);
      dictURL = dictErrFile;
    } else {
      // this._curWord = word;
      // if ((await this._usrProgress.ExistWord(word)) == false) {
      //     this._usrProgress.InsertWord(word).then(() => {
      //         console.log(word + " will be marked as new.");
      //         this._win.webContents.send("QueryWord", "mark_new", true);
      //     });
      //     bNew = false;
      // } else {
      //     let familiar = await this._usrProgress.GetItem(word, "Familiar");
      //     if (familiar < 10) {
      //         console.log(word + " has been marked as new.");
      //         bNew = true;
      //     } else {
      //         console.log(word + " has been rectied.");
      //         bNew = false;
      //     }
      // }
    }

    if (retAudio < 0) {
      // this.Info(-1, 2, word, audio);
      this.Record2File(this._miss_audio, "Audio of " + word + ": " + audioURL + "\n");
    } else if (retAudio == 0) {
      if (this._audioBase.download) {
        // this.TriggerDownload(this._audioBase, word, audio);
      } else {
        const audioName = this._audioBase.szName;
        this.Record2File(this._miss_audio, `Audio of ${word}: ${audioName} doesn't support to download.\n`);
        this.Record2File(this._miss_audio, "\n");
      }
    }

    if (retAudio <= 0) {
      audioURL = this._wrongHintFile;
    }

    if (retDict < 0 || retAudio < 0) {
      this.Record2File(this._miss_audio, "\n");
    }

    if (retAudio == 1) {
      // this.Info(0, 2, "", "");
    }

    dictURL = dictURL.replace(/\\/g, "/");
    audioURL = audioURL.replace(/\\/g, "/");

    const level = "";
    const nStars = 0;
    // try {
    //     level = await this._wordsDict.GetLevel(word);
    //     nStars = await this._wordsDict.GetStar(word);
    // }
    // catch (e) {
    //     this.log('error', `Fail to read ${word} from ${this._wordsDict.szSrcFile}, because of ${e}.`);
    // }

    return [dictURL, audioURL, bNew, level, nStars];

    // this._lastWord = word;
  }

  /*
    public MarkNew(word: string, bNew: string): void {
        if (bNew === 'true') {
            this._usrProgress.InsertWord(word).then(() => {
                console.log(word + " has been marked as new.");
                this._win.webContents.send("QueryWord", "mark_new", true);
            });
        }
        else {
            this._usrProgress.DelWord(word).then(() => {
                console.log(word + " has been removed mark of new.");
                this._win.webContents.send("QueryWord", "mark_new", false);
            });
        }
    }

    public TopMostOrNot(): void {
        var bTop = this._win.isAlwaysOnTop();
        this._win.setAlwaysOnTop(!bTop);
    }

    public async OnTextChanged(word: string): Promise<boolean> {
        let wdsLst: string[] = new Array();

        let ret = await dictbase.get_wordsLst(word, wdsLst);
        if (!ret) {
            console.log("OnTextChanged: no similiar words!")
            return false;
        }

        // this._window.get_browser().ExecuteFunction("clear_words_list");
        this._win.webContents.send("gui", "clearOptions", "words_list");

        for (let wd of wdsLst) {
            // this._window.get_browser().ExecuteFunction("append_words_list", wd);
            this._win.webContents.send("gui", "appendOpt", "words_list", wd);
        }

        return true;
    }
    */

  /*
    public WaitAsyncTasksFnshd(cb: () => void) {
        this.log('info', "Start to quit Dictionary");
        let timerID = setInterval(async () => {
            if (this._dQueue.IsFnshd()) {
                console.info("Finshed to download all files.");
                clearInterval(timerID);
                this.log('info', "Wait 2s to quit.");
                setTimeout(() => {
                    cb();
                }, 2000);
            }
        }, 2000)
    }
    */
}
