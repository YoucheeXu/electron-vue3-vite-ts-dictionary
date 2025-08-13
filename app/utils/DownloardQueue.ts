import * as fs from "fs";
import * as path from "path";
import { BrowserWindow } from "electron";
import { globalVar } from "./globalInterface";

export class DownloardQueue {
  private _downloadQueue: any[] = [];
  private _bDownloading = false;

  constructor(readonly _win: BrowserWindow) {}

  public IsFnshd(): boolean {
    if (this._downloadQueue.length == 0 && this._bDownloading == false) {
      return true;
    } else {
      return false;
    }
  }

  private Dealer(
    cb: (file: string) => void,
    word: string,
    dfile: string,
    progress: number,
    state: string,
    why?: string,
  ) {
    console.log(`${(progress * 100).toFixed(2)}% of ${dfile} was ${state} to download`);
    const gApp = globalVar.app;
    const ext = path.extname(dfile);
    console.log(ext);
    switch (state) {
      case "ongoing":
        break;
      case "fail":
        if (ext == ".json") {
          gApp.Info(-1, 1, word, `Fail to download dict of ${word}, because of ${why}`);
        } else {
          gApp.Info(-1, 2, word, `Fail to download audio of ${word}, because of ${why}`);
        }
        break;
      case "done":
        cb(dfile);
        break;
    }
  }

  public AddQueue(word: string, url: string, local: string, cb: (file: string) => void) {
    for (const item of this._downloadQueue) {
      const urlinQueue = item["url"];
      if (urlinQueue == url) {
        return;
      }
    }
    this._downloadQueue.push({ word: word, url: url, local: local, notify: cb });
    this.DownloadNext();
  }

  private DownloadNext() {
    if (!this._bDownloading) {
      if (this._downloadQueue.length > 0) {
        const valMap = this._downloadQueue.pop();
        this._bDownloading = true;
        this.DownloadFile(valMap.word, valMap.url, valMap.local, valMap.notify);
      }
    }
  }

  private DownloadFile(word: string, url: string, local: string, cb: (file: string) => void) {
    if (fs.existsSync(local) == true) {
      console.log("Already exists " + local);
      return;
    }

    const _this = this;
    _this._win.webContents.session.on("will-download", (event, item, webContents) => {
      console.debug(`${event}, ${webContents}`);
      item.setSavePath(local);
      item.on("updated", (e, state) => {
        console.debug(`${e}`);
        if (state === "progressing") {
          if (item.isPaused()) {
          } else {
            let totalBytes = item.getTotalBytes();
            if (totalBytes == 0) {
              totalBytes = 0.0001;
            }
            const progress = item.getReceivedBytes() / totalBytes;
            _this.Dealer(cb, word, local, progress, "ongoing", state + " in updated");
          }
        } else {
          _this.Dealer(cb, word, local, -1, "fail", state + " in updated");
          _this._bDownloading = false;
          _this.DownloadNext();
        }
      });

      item.on("done", (event, state) => {
        console.debug(`${event}`);
        if (state === "completed") {
          // 这里是主战场
          _this.Dealer(cb, word, local, 1, "done");
          _this._bDownloading = false;
          _this.DownloadNext();
        } else {
          _this.Dealer(cb, word, local, -1, "fail", state + " in done");
          _this._bDownloading = false;
          _this.DownloadNext();
        }
      });

      // 是否可恢复下载
      if (item.canResume()) {
        item.resume();
      }
    });
    this._win.webContents.downloadURL(url);
  }
}
