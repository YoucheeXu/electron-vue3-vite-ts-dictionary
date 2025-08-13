// ReciteWordsApp.ts
import * as path from "path";
import { globalShortcut, dialog } from "electron";

import { formatTime, formatDate, randomArray, randomArray2 } from "./utils/utils";

import { ElectronApp } from "./ElectronApp";

import { UsrProgress } from "./components/UsrProgress";

export class ReciteWordsApp extends ElectronApp {
  private _usrsDict = new Map();

  private _personalProgressFile = "";

  private _today: Date = new Date();
  private _timeDayLst: number[] = [];

  private _mode = "Study Mode";

  private _wordsMap = new Map<string, [number, Date, Date]>();

  private _learnLst: string[] = [];
  private _curLearnLst: string[] = [];
  private _curLearnPos = 0;
  private _testLst: string[] = [];
  private _curTestLst: string[] = [];
  private _curTestPos = 0;

  private _testCount = 0;
  // private _errCount = 0;
  private _curCount = 1;

  private _curWord = "";
  private _lastWord = "";

  constructor(readonly startPath: string) {
    /*
        this._root.bind("<Escape>", this._exit_app);
        this._root.bind("<Return>", this._check_input);
        */
    super(startPath);
  }

  public async ReadAndConfigure(binPath: string, cfgFile: string): Promise<boolean> {
    await super.ReadAndConfigure(binPath, cfgFile);

    // read all users
    for (const usrCfg of this._cfg.Users) {
      const name = usrCfg.Name;
      const levels = usrCfg.Target;
      this._usrsDict.set(name, levels);
      console.log(`User: ${name}, Levels: ${levels}`);
    }

    return true;
  }

  public async Run(argvs: any, bDev: boolean) {
    await super.Run(argvs, bDev);
  }

  private GoStudyMode() {
    this._mode = "Study Mode";
    this._win.webContents.send("gui", "modifyValue", "title", "Study Mode");
    console.log("Study Mode");

    this._win.webContents.send("gui", "modifyValue", "count", "");

    this._curLearnPos = 0;
    const len = this._learnLst.length;
    if (len > 0) {
      const limit = Math.min(10, len);
      this._curLearnLst = this._learnLst.splice(0, limit);
    } else {
      this._curLearnLst.length = 0;
      // this._win.webContents.send("gui", "modifyAttr", "forgetBtn", "disabled", false);
      this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn", false);
      this.GoTestMode();
    }

    this._win.webContents.send("gui", "modifyValue", "numOfLearn", `${this._learnLst.length} words to Learn!`);
    this.Study_Next();
  }

  private async Study_Next() {
    const len = this._curLearnLst.length;
    if (len > 0) {
      this._curWord = this._curLearnLst[this._curLearnPos];

      this._win.webContents.send("gui", "modifyValue", "score", "");

      const value = this._wordsMap.get(this._curWord);
      if (value) {
        const familiar = value[0];
        const lastDate = value[1];

        if (lastDate.getFullYear() == 1970) {
          this._win.webContents.send("gui", "modifyValue", "score", "New!");
        } else if (familiar < 0) {
          this._win.webContents.send("gui", "modifyValue", "score", "Forgotten");
        } else {
          this._win.webContents.send("gui", "modifyValue", "score", "");
        }
      }

      const data = this._wordsMap.get(this._curWord);
      if (data != undefined) {
        const familiar = data[0];
        const lastDate = data[1];
        const nextDate = data[2];
        const msg = `Familiar: ${familiar}, LastDate: ${formatDate(lastDate)}, NextDate: ${formatDate(nextDate)}`;
        console.log(`LearnWord: ${this._curWord}, ${msg}`);
        this._win.webContents.send("gui", "modifyValue", "info", msg);
      }

      this.Show_Content(this._curWord, true);
      this.PlayAudio();

      this._win.webContents.send("gui", "modifyValue", "numOfWords", `${this._curLearnPos + 1} of ${len}`);

      // this._curLearnPos += 1;
    }
  }

  private GoTestMode() {
    this._mode = "Test Mode";
    this._win.webContents.send("gui", "modifyValue", "title", "Test Mode");
    console.log("Test Mode");

    const len = this._testLst.length;
    if (this._curCount <= this._testCount && this._curTestLst.length > 0) {
      this._curTestPos = 0;
      this._win.webContents.send("gui", "modifyValue", "count", `Count: ${this._curCount} of ${this._testCount}`);
      // this.Clear_Content();
      this.Test_Next();
    } else if (this._curLearnLst.length > 0) {
      // this._win.webContents.send("gui", "modifyAttr", "forgetBtn", "disabled", true);
      this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn");
      this.GoStudyMode();
    } else if (len > 0) {
      const limit = Math.min(10, len);
      this._curTestLst = this._testLst.splice(0, limit);
      this._win.webContents.send("gui", "modifyValue", "numOfTest", `${this._testLst.length} words to Test!`);
      this._curTestPos = 0;
      this._curCount = 1;
      this._win.webContents.send("gui", "modifyValue", "count", `Count: ${this._curCount} of ${this._testCount}`);
      this.Test_Next();
    } else if (this._learnLst.length > 0) {
      // this._win.webContents.send("gui", "modifyAttr", "forgetBtn", "disabled", true);
      this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn");
      this.GoStudyMode();
    } else {
      this._curTestPos += 1;
      this.Quit();
    }
  }

  private Test_Next() {
    this._curWord = this._curTestLst[this._curTestPos];

    const data = this._wordsMap.get(this._curWord);
    if (data != undefined) {
      const familiar = data[0];
      const lastDate = data[1];
      const nextDate = data[2];
      const msg = `Familiar: ${familiar}, LastDate: ${formatDate(lastDate)}, NextDate: ${formatDate(nextDate)}`;
      console.log(`TestWord: ${this._curWord}, ${msg}`);
      this._win.webContents.send("gui", "modifyValue", "info", msg);
    }

    this._win.webContents.send("gui", "modifyValue", "word", "");

    if (this._lastWord != "") {
      this.Show_Content(this._lastWord);
    }
    this.PlayAudio();

    this._win.webContents.send(
      "gui",
      "modifyValue",
      "numOfWords",
      `${this._curTestPos + 1} of ${this._curTestLst.length}`,
    );
  }

  /*
    private Check_Input(input_word: string) {
        if (this._mode == "Study Mode") {
            this._curLearnPos++;
            if (this._curLearnPos < this._curLearnLst.length) {
                this.Study_Next();
            }
            else {
                this._curCount = 1;
                console.log(`curCount: ${this._curCount}`);
                this._curTestLst = (this._curLearnLst || []).concat();
                // this._win.webContents.send("gui", "modifyAttr", "forgetBtn", "disabled", false);
                this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn", false);
                this.GoTestMode();
            }
        }
        else {
            if (input_word != this._curWord) {
                this._errCount += 1;
                this._win.webContents.send("gui", "modifyValue", "score", `Wrong word: ${input_word}, wrong count: ${this._errCount}!`);
                this._logger.debug(`ErrCount: ${this._errCount}`);
                this._logger.debug(`Right word: ${this._curWord}, Wrong word: ${input_word}.`);

                let data = this._wordsMap.get(this._curWord);
                if (data === undefined) {
                    throw new Error(`${this._curWord} is not in WordsDict!`);
                }
                let familiar = data[0];
                let lastDate = data[1];
                let nextDate = data[2];

                if (this._errCount == 1) {
                    // this._curTestPos -= 1;
                    // this._wordsMap.set(word, familiar - 1);
                }
                else if (this._errCount < 3) {
                    // this._curTestPos -= 1;
                    this._wordsMap.set(this._curWord, [familiar - 1, lastDate, nextDate]);
                }
                else {
                    this._win.webContents.send("gui", "modifyValue", "word", "");
                    this.Show_Content(this._curWord, true);
                    this.PlayAudio();

                    this._win.webContents.send("gui", "modifyValue", "score", "Go on!");
                    this._wordsMap.set(this._curWord, [familiar - 4, lastDate, nextDate]);
                    this._learnLst.push(this._curWord);
                    console.log(this._curWord + " has been added in learn list.");
                    this._errCount = 0;
                    this._win.webContents.send("gui", "modifyValue", "numOfLearn", `${this._learnLst.length} words to Learn!`);
                    return;
                }
            }
            else {
                this._win.webContents.send("gui", "modifyValue", "score", "OK!");
                this._errCount = 0;
                this._lastWord = this._curWord;
                this._curTestPos++;
            }

            if (this._curTestPos < this._curTestLst.length) {
                // this._win.webContents.send("gui", "modifyValue", "word", "");
                this.Test_Next();
            }
            else {
                this._curCount += 1;
                console.log(`curCount: ${this._curCount}`);
                this.GoTestMode();
            }
        }
    }
    */
  private Chop() {
    for (let i = 0; i < this._curLearnLst.length; i++) {
      if (this._curLearnLst[i] == this._curWord) {
        this._curLearnLst.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < this._learnLst.length; i++) {
      if (this._learnLst[i] == this._curWord) {
        this._learnLst.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < this._curTestLst.length; i++) {
      if (this._curTestLst[i] == this._curWord) {
        this._curTestLst.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < this._testLst.length; i++) {
      if (this._testLst[i] == this._curWord) {
        this._testLst.splice(i, 1);
        i--;
      }
    }

    const data = this._wordsMap.get(this._curWord);
    if (data != undefined) {
      const lastDate = this._today;
      const nextDate = data[2];
      this._wordsMap.set(this._curWord, [10, lastDate, nextDate]);
    }
    console.log(`${this._curWord} has been chopped!`);
    this._win.webContents.send("gui", "modifyValue", "numOfTest", `${this._testLst.length} words to Test!`);

    if (this._mode == "Study Mode") {
      this._lastWord = this._curWord;

      if (this._curLearnPos < this._curLearnLst.length) {
        this.Study_Next();
      } else if (this._learnLst.length > 0 && this._curLearnLst.length == 0) {
        this.GoStudyMode();
      } else {
        this._curCount = 1;
        console.log(`curCount: ${this._curCount}`);
        this._curTestLst = (this._curLearnLst || []).concat();
        // this._win.webContents.send("gui", "modifyAttr", "forgetBtn", "disabled", false);
        this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn", false);
        this.GoTestMode();
      }
    } else {
      this._lastWord = this._curWord;

      if (this._curTestPos < this._curTestLst.length) {
        this.Test_Next();
      } else {
        this._curCount += 1;
        console.log(`curCount: ${this._curCount}`);
        this.GoTestMode();
      }
    }
  }

  private Forgoten() {
    // let word = "";

    if (this._mode == "Test Mode") {
      // this._errCount = 0;

      // word = this._curTestLst[this._curTestPos];

      for (let i = 0; i < this._curTestLst.length; i++) {
        if (this._curTestLst[i] == this._curWord) {
          this._curTestLst.splice(i, 1);
          i--;
        }
      }

      for (let i = 0; i < this._testLst.length; i++) {
        if (this._testLst[i] == this._curWord) {
          this._testLst.splice(i, 1);
          i--;
        }
      }

      const data = this._wordsMap.get(this._curWord);
      if (data != undefined) {
        const familiar = data[0];
        const lastDate = this._today;
        const nextDate = new Date();
        // nextDate.setDate(this._today.getDate() - Number(this._timeDayLst[0]));
        this._wordsMap.set(this._curWord, [familiar - 5, lastDate, nextDate]);
      }

      this._learnLst.push(this._curWord);
      console.log(this._curWord + " has been added in learn list.");
      this._win.webContents.send("gui", "modifyValue", "numOfLearn", `${this._learnLst.length} words to Learn!`);

      console.log(this._curWord + " is forgotten!");

      this._lastWord = this._curWord;

      if (this._curTestPos < this._curTestLst.length) {
        this.Test_Next();
      } else {
        this._curCount += 1;
        console.log(`curCount: ${this._curCount}`);
        this.GoTestMode();
      }
    }
    return this._curWord;
  }

  /*private Clear_Content() {
        this._win.webContents.send("gui", "modifyValue", "word", "");
        this._win.webContents.send("gui", "modifyValue", "symbol", "");
        this._win.webContents.send("gui", "modifyValue", "txtArea", "");
    }*/

  // To-Do
  private async PlayAudio(): Promise<boolean> {
    if (this._curWord == this._lastWord) {
      this._win.webContents.send("gui", "playAudio");
    } else {
      let retAudio = -1;
      let audioFile = "";
      [retAudio, audioFile] = await this._audioBase.query_audio(this._curWord);
      if (retAudio < 0) {
        this._logger.error(audioFile);
        this._win.webContents.send("gui", "loadAndPlayAudio", this._wrongHintFile.replace(/\\/g, "/"));
        return Promise.resolve(false);
      } else if (retAudio == 0) {
        if (this._audioBase.download) {
          // await this.TriggerDownload(this._audioBase, this._curWord, audioFile);
        } else {
          this._logger.error(`There is no audio of ${this._curWord} in ${this._audioBase.srcFile}`);
        }
        return Promise.resolve(false);
      } else {
        this._win.webContents.send("gui", "loadAndPlayAudio", audioFile.replace(/\\/g, "/"));
        if (this._mode == "Study Mode") {
          this._lastWord = this._curWord;
        }
      }
    }
    return Promise.resolve(true);
  }

  private async Show_Content(word: string, bShowWord = false) {
    if (bShowWord) {
      this._win.webContents.send("gui", "modifyValue", "word", word);
    }

    if (this._curDictBase) {
      const [retDict, dict] = await this._curDictBase.query_word(word);
      if (retDict < 0) {
        this.Record2File(this._miss_dict, "Dict of " + word + ": " + dict + "\n");
        this._win.webContents.send("gui", "modifyValue", "txtArea", dict);
      } else if (retDict == 0) {
        if (this._curDictBase.download) {
          // this.TriggerDownload(this._curDictBase, word, dict);
        }
      } else {
        const txtLst = dict.split(";;");
        if (retDict == 1) {
          const symbol = txtLst[0];
          this._win.webContents.send("gui", "modifyValue", "symbol", "[" + symbol + "]");
          const meaning = txtLst[1];

          if (txtLst[2] == null) {
            txtLst[2] = "";
          }

          let sentences = txtLst[2].replace(/"/g, '\\"');
          sentences = sentences.replace(/'/g, "\\'");
          sentences = sentences.replace(/`/g, "\\`");

          const txtContent = meaning + "\n" + sentences.replace(/\/r\/n/g, "\n");
          // txtContent = txtContent.replace(/<br>/g, "");
          this._win.webContents.send("gui", "modifyValue", "txtArea", txtContent);
        }
      }
    }
  }

  public readUsrs() {
    /*this._usrDict.forEach((usrName: string, levels: Array<string>) => {
            this._logger.info(`User: ${usrName}, Levels: ${levels}`);
            this._win.webContents.send("gui", "appendList", "usr-select", usrName);
            for (let lvl of levels){

            }
        });

        this._win.webContents.send("gui", "appendList", "usr-select", "Add more...");
        this._win.webContents.send("gui", "appendList", "lvl-select", "Add more...");
        
        this._win.webContents.send("gui", "displayOrHide", "SelDiag", true);
        this._win.webContents.send("gui", "displayOrHide", "bg", true);
        */
    return this._usrsDict;
  }

  public readAllLvls() {
    return this._cfg["WordsDict"]["allLvls"];
  }

  public async newLevel(usrName: string, level: string) {
    console.log(`usr: ${usrName}, new level: ${level}`);
    for (const usrCfg of this._cfg.Users) {
      if (usrName == usrCfg.Name) {
        if (this._usrProgress === undefined) {
          this._usrProgress = new UsrProgress();
        }
        const progressFile = path.join(this._startPath, usrCfg.Progress).replace(/\\/g, "/");
        await this._usrProgress.Open(progressFile, level);
        if ((await this._usrProgress.ExistTable(level)) == false) {
          this._usrProgress.NewTable(level);
        }

        const lvlWordsLst: string[] = [];
        const ret = await this._wordsDict.GetWordsLst(lvlWordsLst, level);
        if (ret) {
          for (const word of lvlWordsLst) {
            // console.log("Going to insert: " + word);
            await this._usrProgress.InsertWord(word);
          }
        } else {
          return Promise.resolve<boolean>(false);
        }

        const target = usrCfg.Target;
        target[target.length] = level;
        this._bCfgModfied = true;

        return Promise.resolve<boolean>(true);
      }
    }
    return Promise.resolve<boolean>(false);
  }

  // TODO: record it in json
  public async NewUsr(usrName: number, level: string) {
    this._bCfgModfied = true;

    this._usrProgress = new UsrProgress();
    // dict/XYQ.progress
    const progressFile = path.join(this._startPath, "dict", usrName + ".progress").replace(/\\/g, "/");
    await this._usrProgress.New(progressFile, level);

    const lvlWordsLst: string[] = [];
    const ret = await this._wordsDict.GetWordsLst(lvlWordsLst, level);
    if (ret) {
      for (const word of lvlWordsLst) {
        // console.log("Going to insert: " + word);
        await this._usrProgress.InsertWord(word);
      }
    } else {
      return Promise.resolve<boolean>(false);
    }
  }

  public async isLevelDone(usrName: string, level: string): Promise<boolean | string> {
    for (const usrCfg of this._cfg.Users) {
      if (usrName == usrCfg.Name) {
        const progress = usrCfg.Progress;
        const progressFile = path.join(this._startPath, progress).replace(/\\/g, "/");
        this._logger.info("progress: ", progressFile);
        if (this._usrProgress === undefined) {
          this._usrProgress = new UsrProgress();
        }
        try {
          await this._usrProgress.Open(progressFile, level);
          const numOfUnrecitedWord1 = await this._usrProgress.GetInProgressCount(level);
          const numOfUnrecitedWord2 = await this._usrProgress.GetNewCount(level);
          if (numOfUnrecitedWord1 + numOfUnrecitedWord2 == 0) {
            let ret = await dialog.showMessageBox({
              type: "info",
              message: `${usrName}'s ${level} is done! Do you want to reset?`,
              buttons: ["Yes", "No"],
            });

            if (ret.response == 0) {
              ret = await dialog.showMessageBox({
                type: "info",
                message: `Reset function is not implemented!`,
                buttons: ["Confirm"],
              });
              return Promise.resolve(true);
            } else {
              return Promise.resolve(true);
            }
          } else {
            return Promise.resolve(false);
          }
        } catch (e) {
          this._logger.error(e);
          return Promise.reject(e);
        }
        break;
      }
    }
    return Promise.reject("Usr doesn't exist!");
  }

  public async Go(usrName: string, level: string) {
    console.log("Go!");

    /*globalShortcut.unregister('Enter');
        globalShortcut.register('Enter', () => {
        });*/
    globalShortcut.register("F5", () => {
      this.PlayAudio();
    });
    globalShortcut.register("F6", () => {
      this.Forgoten();
    });
    globalShortcut.register("F7", () => {
      this.Chop();
    });

    // read user;
    for (const usrCfg of this._cfg.Users) {
      if (usrName == usrCfg.Name) {
        const progress = usrCfg.Progress;
        const progressFile = path.join(this._startPath, progress).replace(/\\/g, "/");
        this._logger.info("progress: ", progressFile);
        if (this._usrProgress === undefined) {
          this._usrProgress = new UsrProgress();
        }
        // await this._usrProgress.Open(progressFile);
        await this._usrProgress.Open(progressFile, level);
        break;
      }
    }

    // this._today = new Date();
    this._personalProgressFile = path.join(this._startPath, "log", `${usrName}_${level}.log`);
    this.LogProgress(`Select User: ${usrName}, Level: ${level}`);

    // update info;
    this._win.webContents.send("gui", "modifyValue", "studyLearnBtn", `正在学习`);

    this._win.webContents.send("gui", "modifyValue", "usr", `${usrName}`);

    this._win.webContents.send("gui", "modifyValue", "level", `${level}`);

    // where = "level = '" + level + "'";
    const allCount = await this._usrProgress.GetAllCount(level);
    this._win.webContents.send("gui", "modifyValue", "allCount", `All words: ${allCount}`);
    this.LogProgress(`All words: ${allCount}`);

    // where = "level = '" + level + "' and LastDate is null ";
    const newCount = await this._usrProgress.GetNewCount(level);
    this._win.webContents.send("gui", "modifyValue", "newCount", `New words to learn: ${newCount}`);
    this.LogProgress(`New words to learn: ${newCount}`);

    // where = "level = '" + level + "' and familiar = 10";
    const finishCount = await this._usrProgress.GetFnshedCount(level);
    this._win.webContents.send("gui", "modifyValue", "finishCount", `Words has recited: ${finishCount}`);
    this.LogProgress(`Words has recited: ${finishCount}`);

    // where = "level = '" + level + "' and familiar > 0";
    const InProgressCount = await this._usrProgress.GetInProgressCount(level);
    this._win.webContents.send("gui", "modifyValue", "InProgressCount", `Words in learning: ${InProgressCount}`);
    this.LogProgress(`Words in learning: ${InProgressCount}`);

    // ready to get words to recite
    const allLimit = this._cfg.ReciteWords.General.TotalLimit;
    const newWdsLimit = this._cfg.ReciteWords.General.NewLimit;
    let limit = 0;

    // start get words to recite
    const wdsLst: any[] = [];
    const todayStr = formatDate(this._today);

    // Start to get forgotten words
    console.log("Start to get forgotten words");
    wdsLst.length = 0;
    limit = Math.min(allLimit - this._wordsMap.size, newWdsLimit);
    let numOfAllForgoten = 0,
      numOfSelForgotten = 0;

    if (await this._usrProgress.GetForgottenWordsLst(wdsLst)) {
      numOfAllForgoten = wdsLst.length;
      for (const wd of wdsLst) {
        this._wordsMap.set(wd.Word, [Number(wd.Familiar), new Date(wd.LastDate), new Date(wd.NextDate)]);
        this._logger.debug(
          `Word: ${wd.Word}, Familiar: ${wd.Familiar}, LastDate: ${wd.LastDate}, NextDate: ${wd.NextDate}`,
        );
        this._learnLst.push(wd.Word);
        numOfSelForgotten++;
        if (numOfSelForgotten >= limit) {
          break;
        }
      }
    }
    this.LogProgress(`Got ${numOfAllForgoten} forgotten words.`);
    this.LogProgress(`Select ${numOfSelForgotten} forgotten words.`);

    // Start to get over due words
    console.log("Start to get over due words");
    wdsLst.length = 0;
    limit = allLimit - this._wordsMap.size;
    let numOfAllOvrDue = 0,
      numOfSelOvrDue = 0;

    if (await this._usrProgress.GetOvrDueWordsLst(wdsLst, todayStr)) {
      numOfAllOvrDue = wdsLst.length;
      for (const wd of wdsLst) {
        this._wordsMap.set(wd.Word, [Number(wd.Familiar), new Date(wd.LastDate), new Date(wd.NextDate)]);
        this._logger.debug(
          `Word: ${wd.Word}, Familiar: ${wd.Familiar}, LastDate: ${wd.LastDate}, NextDate: ${wd.NextDate}`,
        );
        numOfSelOvrDue++;
        if (this._wordsMap.size >= allLimit) {
          break;
        }
      }
    }
    this.LogProgress(`Got ${numOfAllOvrDue} over due words.`);
    this.LogProgress(`Select ${numOfSelOvrDue} over due words.`);

    // Start to get due words
    console.log("Start to get due words");
    wdsLst.length = 0;
    limit = allLimit - this._wordsMap.size;
    let numOfAllDue = 0,
      numOfSelDue = 0;

    if (await this._usrProgress.GetDueWordsLst(wdsLst, todayStr)) {
      numOfAllDue = wdsLst.length;
      for (const wd of wdsLst) {
        this._wordsMap.set(wd.Word, [Number(wd.Familiar), new Date(wd.LastDate), new Date(wd.NextDate)]);
        this._logger.debug(
          `Word: ${wd.Word}, Familiar: ${wd.Familiar}, LastDate: ${wd.LastDate}, NextDate: ${wd.NextDate}`,
        );
        numOfSelDue++;
        if (this._wordsMap.size >= allLimit) {
          break;
        }
      }
    }
    this.LogProgress(`Got ${numOfAllDue} due words.`);
    this.LogProgress(`Selct ${numOfSelDue} due words.`);

    // Start to get new words
    console.log("Start to get new words");
    wdsLst.length = 0;
    limit = Math.min(newWdsLimit - numOfSelForgotten, allLimit - this._wordsMap.size);
    let newWdNum = 0;

    if (limit > 0) {
      if (await this._usrProgress.GetNewWordsLst(wdsLst, limit)) {
        for (const wd of wdsLst) {
          this._wordsMap.set(wd.Word, [Number(wd.Familiar), new Date(wd.LastDate), new Date(wd.NextDate)]);
          this._logger.debug(
            `Word: ${wd.Word}, Familiar: ${wd.Familiar}, LastDate: ${wd.LastDate}, NextDate: ${wd.NextDate}`,
          );
          this._learnLst.push(wd.Word);
          newWdNum++;
        }
      }
    }
    this.LogProgress(`Got ${newWdNum} new words.`);

    // ready to recite
    const timeArray = this._cfg["ReciteWords"]["TimeInterval"];
    for (const timeGroup of timeArray) {
      if (timeGroup["Unit"] == "d") {
        this._timeDayLst.push(timeGroup["Interval"]);
      }
    }
    this._testCount = this._cfg.ReciteWords.TestMode.Times;

    // random learn list
    randomArray2(this._learnLst);
    this.LogProgress(`Length of LearnList: ${this._learnLst.length}.`);

    // complement test list
    for (const word of Array.from(this._wordsMap.keys())) {
      this._testLst.push(word);
    }
    // random test list
    this._testLst = randomArray(this._testLst);
    this.LogProgress(`Length of TestList: ${this._testLst.length}.`);

    //this._wordInput['state'] = 'readonly';

    this._win.webContents.send("gui", "modifyValue", "numOfLearn", `${this._learnLst.length} words to Learn!`);
    this._win.webContents.send("gui", "modifyValue", "numOfTest", `${this._testLst.length} words to Test!`);

    if (this._learnLst.length > 0) {
      this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn");
      this.GoStudyMode();
    } else {
      this._win.webContents.send("gui", "DisaOrEnaBtn", "forgetBtn", false);
      this.GoTestMode();
    }
  }

  private async LogProgress(info: string): Promise<boolean> {
    // 2021-08-25 19:59:01 it cost 0 hours, 50 minutes, 18 seconds.
    const now = new Date();
    const nowStr = formatTime(now);
    const something = `${nowStr} ${info}\n`;
    // console.log(something);

    return super.Record2File(this._personalProgressFile, something);
  }

  private async Save_Progress() {
    // remove words which hadn't be recited
    for (const word of this._testLst) {
      if (this._wordsMap.has(word)) {
        this._wordsMap.delete(word);
      }
    }

    if (this._mode == "Study Mode") {
      for (const word of this._curLearnLst) {
        if (this._wordsMap.has(word)) {
          const data = this._wordsMap.get(word);
          if (data != undefined) {
            const familiar = data[0] - 1;
            const lastDate = data[1];
            const nextDate = data[2];
            this._wordsMap.set(word, [familiar, lastDate, nextDate]);
          }
        }
      }
    } else {
      if (this._curCount >= this._testCount) {
        this._curTestLst.splice(0, this._curTestPos - 1);
      }

      for (const word of this._curTestLst) {
        if (this._wordsMap.has(word)) {
          this._wordsMap.delete(word);
        }
      }
    }

    for (const word of this._learnLst) {
      if (this._wordsMap.has(word)) {
        const data = this._wordsMap.get(word);
        if (data != undefined) {
          const familiar = data[0] - 1;
          const lastDate = data[1];
          const nextDate = data[2];
          this._wordsMap.set(word, [familiar, lastDate, nextDate]);
        }
      }
    }

    const allLen = this._wordsMap.size;
    this.LogProgress(`Number of words' familiar will be changed: ${allLen}`);

    let lastDateStr = "",
      nexDateStr = "";
    let mapStr = "{";
    this._wordsMap.forEach(([familiar, lastDate, nextDate], word) => {
      if (lastDate != null) {
        lastDateStr = formatDate(lastDate);
      } else {
        lastDateStr = "";
      }
      if (nextDate != null) {
        nexDateStr = formatDate(nextDate);
      } else {
        nexDateStr = "";
      }

      mapStr += `${word}: ${String(familiar)}, lastDate: ${lastDateStr}, nextDate: ${nexDateStr};`;
    });
    mapStr += "}";
    console.log("WordsDict = " + mapStr);

    let i = 0,
      nFnshd = 0;
    const iterator = this._wordsMap.entries();
    let r: IteratorResult<[string, [number, Date, Date]]>;
    const todayStr = formatDate(this._today);
    let intervalDay = 0,
      index = 0;
    let nextInterval = 0;
    while (((r = iterator.next()), !r.done)) {
      let [word, [familiar, lastDate, nextDate]] = r.value;
      familiar += 1.0;

      if (familiar >= 10) {
        familiar = 10.0;
        nFnshd++;
      } else if (familiar < -10) {
        familiar = -10.0;
      }

      familiar = Number(familiar.toFixed(1));

      // calc next date
      if (lastDate != null && nextDate != null) {
        intervalDay = (nextDate.valueOf() - lastDate.valueOf()) / 1000 / 60 / 60 / 24;
      } else {
        intervalDay = 0;
        index = 0;
      }
      if (intervalDay > 0) {
        index = this._timeDayLst.indexOf(intervalDay);
        if (index != -1) {
          index++;
          if (index >= this._timeDayLst.length) {
            // next round
            index = 0;
          }
        } else {
          // error
          index = 0;
        }
      } else {
        // new word
        index = 0;
      }

      if (familiar < 0) {
        // forgotten word
        index = 0;
      }

      nextInterval = this._timeDayLst[index];
      nextDate = new Date();
      // Object.assign(nextDate, this._today);
      nextDate.setDate(this._today.getDate() + nextInterval);
      nexDateStr = formatDate(nextDate);

      try {
        this._logger.debug(`${word}: ${String(familiar)}, lastDate: ${todayStr}, nextDate: ${nexDateStr}`);
        await this._usrProgress.UpdateProgress2(word, familiar, todayStr, nexDateStr);
        i++;
        const percent = (i / allLen) * 100;
        this._win.webContents.send("gui", "modifyValue", "info", `${percent.toFixed(2)}% to save progress.`);
      } catch (e) {
        this._logger.error((e as Error).message);
        this._logger.error(e);
      }
    }

    this.LogProgress(`Finish to receite number of words: ${nFnshd}`);
    // console.log("OK to save progress.");
    this._win.webContents.send("gui", "modifyValue", "info", `OK to save progress.`);
  }

  public async Quit(bStrted: boolean = true) {
    if (bStrted == true) {
      const now = new Date();
      let sec = now.getSeconds() - this._today.getSeconds();
      let min = now.getMinutes() - this._today.getMinutes();
      let hour = now.getHours() - this._today.getHours();

      if (sec < 0) {
        sec += 60;
        min--;
      }
      if (min < 0) {
        min += 60;
        hour--;
      }

      await this.Save_Progress();
      await this.LogProgress(`It cost ${hour} hours, ${min} minutes, ${sec} seconds.\n`);
    }

    await super.Quit();
  }
}
