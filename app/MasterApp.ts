// MasterApp.ts
import { BrowserWindow, app, dialog } from "electron";
import * as path from "path";
import { DictApp } from "./DictApp";
// import { ReciteWordsApp } from "./ReciteWordsApp";
// import { globalVar } from "./utils/globalInterface";

export class MasterApp {
  private _myApp: any;
  private _win: BrowserWindow | null = null;

  public get app() {
    return this._myApp;
  }

  private async WaitForElectronAppReady() {
    if (app.isReady()) return Promise.resolve();

    return new Promise((resolve) => {
      const iid = setInterval(() => {
        if (app.isReady()) {
          clearInterval(iid);
          resolve(null);
        }
      }, 10);
    });
  }

  private EnsureSingleInstance(): boolean {
    // if (this.env_ === 'dev') return false;

    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      // Another instance is already running - exit
      app.quit();
      return true;
    }

    // Someone tried to open a second instance - focus our window instead
    const _this = this;
    app.on("second-instance", () => {
      const win = _this._win;
      if (!win) return;
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    });

    return false;
  }

  public async Run(argvs: any): Promise<void> {
    // Since we are doing other async things before creating the window, we might miss
    // the "ready" event. So we use the function below to make sure that the app is ready.
    await this.WaitForElectronAppReady();

    const alreadyRunning = this.EnsureSingleInstance();
    if (alreadyRunning) return;

    // const sel = 0;
    let sel = 0;
    if (argvs.typ) {
      if (argvs.typ == "r") {
        sel = 1;
      } else if (argvs.typ == "d" || argvs.typ == "c") {
        sel = 0;
      }
    } else {
      const ret = await dialog.showMessageBox({
        type: "info",
        message: "Select a application",
        buttons: ["Dictionary", "ReciteWords"],
        cancelId: 2, // 点击x号关闭返回值
      });

      sel = ret.response;
    }

    let startPath = "";
    // if (process.env.NODE_ENV === 'development') {
    if (argvs.bDev) {
      startPath = path.join(process.cwd(), "./");
    } else {
      startPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR || process.cwd(), "../");
    }

    if (sel == 1) {
      // this._myApp = new ReciteWordsApp(startPath);
      this._myApp.name = "ReciteWords";
      // globalVar.app = this._myApp;
    } else if (sel == 0) {
      this._myApp = new DictApp(startPath);
      this._myApp.name = "Dictionary";
      // globalVar.app = this._myApp;
    } else {
      app.quit();
      return;
    }

    try {
      this._myApp.Run(argvs, argvs.bDev);
    } catch (e) {
      console.error(`ElectronApp fatal error: ${e}`);
      // alert(`ElectronApp fatal error: ${e}`);
    }

    app.on("before-quit", () => {
      // this.willQuitApp_ = true;
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });

    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      // if (BrowserWindow.getAllWindows().length === 0) this._myApp.createWindow()
      this._win?.show();
    });
  }
}
