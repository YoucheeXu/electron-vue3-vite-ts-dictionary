// background.ts

// import { Menu, MenuItem} from 'electron';
// import { app, BrowserWindow, ipcMain } from 'electron';
// import * as path from "path";
import { ipcMain } from "electron";

import { MasterApp } from "../app/MasterApp";

// 屏蔽控制台渲染进程使用不安全的方式加载资源 警告
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

interface KeyValue {
  [key: string]: any;
}

const argvs: KeyValue = {};

for (const argv of process.argv) {
  console.log("argv: " + argv);

  const paraStrtIndex = argv.indexOf("--");
  if (paraStrtIndex >= 0) {
    const paraEndtIndex = argv.indexOf(" ");
    let para = "";
    if (paraEndtIndex > 0) {
      para = argv.substring(paraStrtIndex + 2, paraEndtIndex);
    } else {
      para = argv.substring(paraStrtIndex + 2);
    }
    console.log("para: " + para);
    if (para == "type") {
      argvs.typ = argv.substring(7);
    } else if (para == "q") {
      argvs.word = argv.substring(4);
    } else if (para == "dev") {
      argvs.bDev = true;
    }
  }
}

let curPath = "";

const idx = process.resourcesPath.indexOf("\\node_modules\\");
if (idx == -1) {
  console.log("Production Enviroment");
  curPath = process.resourcesPath;
} else {
  console.log("Development Enviroment");
  curPath = process.resourcesPath.substring(0, idx);
  argvs.bDev = true;
  argvs.URL = process.argv[2];
}

console.log("curPath: " + curPath);

let myApp: MasterApp;

try {
  myApp = new MasterApp();
  myApp.Run(argvs);
} catch (e) {
  console.error(`ElectronApp fatal error: ${e}`);
}

/*
async function CreateWindow(bShow: boolean, bDev: boolean, width: number, height: number, bFullScreen: boolean): Promise<void> {
    // const startPath = path.join(process.cwd(), "./");
    const startPath = path.join(curPath, "src");
    // const name = "Dictionary";
    console.log(`startPath: ${startPath}`);
    // Create the browser window.
    const win = new BrowserWindow({
        icon: path.join(startPath, 'assets/dictApp.ico'),
        width: width,
        height: height,
        fullscreen: bFullScreen,
        show: bShow,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            // contextIsolation: false,
            // preload: 'preload.js'
            preload: path.join(curPath, 'output/build/electron/preload.js')
        },
    });

    // __dirname
    if (bShow) {
        // win.loadURL(`file://${startPath}/assets/${name}.html`);
        win.loadURL('http://localhost:5173');
        if (bDev) {
            // Open the DevTools.
            win.webContents.openDevTools({ mode: 'detach' });
        }
    }

    // let _this = this;
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        // _this._win = null;
    });
}

app.on('ready', async () => {
    // 这里注释掉是因为会安装tools插件，需要屏蔽掉，有能力的话可以打开注释
    // if (isDevelopment && !process.env.IS_TEST) {
    //   try {
    //     await installVueDevtools();
    //   } catch (e) {
    //     console.error('Vue Devtools failed to install:', e.toString());
    //   }
    // }
    let bShow = true;
    let guiCfg = {
        Width: 701,
        Height: 548,
        bFullScreen: false
    }
    await CreateWindow(bShow, argvs.bDev, guiCfg.Width, guiCfg.Height, guiCfg.bFullScreen);
});
*/

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// ipcMain.on('log4js:trace', trace);
// ipcMain.on('log4js:debug', debug);
// ipcMain.on('log4js:info', info);
// ipcMain.on('log4js:warn', warn);
// ipcMain.on('log4js:error', error);
// ipcMain.on('log4js:fatal', fatal);
// ipcMain.on('log4js:mark', mark);

/*

//-----------------------------------------------------------------
//监听与渲染进程的通信

ipcMain.on('syncMsg', async (event: any, fun: string, ...paras: string[]) => {
    let parasStr: string = paras.join('`, `');
    if (paras.length >= 1) {
        parasStr = '`' + parasStr + '`';
    }

    let command: string = `myApp.myApp.${fun}(${parasStr})`;
    // let command: string = `globalVar.app.${fun}(${parasStr})`;
    // console.log("command: " + command);

    try {
        // event.returnValue = eval(command);
        event.returnValue = await eval(command);
    }
    catch (e) {
        // console.error(`Fail to exec ${command} because ${(e as Error).message}`);
        console.error(`Fail to exec ${command} because ${e}`);
        event.returnValue = e;
    }
});

ipcMain.on('dictApp', (event: any, fun: string, ...paras: string[]) => {
    let parasStr: string = paras.join('`, `');
    if (paras.length >= 1) {
        parasStr = '`' + parasStr + '`';
    }

    let sender = event.sender;
    let command: string = `myApp.myApp.${fun}(${parasStr})`;
    // let command: string = `globalVar.app.${fun}(${parasStr})`;
    // console.log("command: " + command);

    try {
        eval(command);
    }
    catch (e) {
        console.error(`Fail to exec ${command} because ${(e as Error).message}`);
    }

    event.returnValue = 'true';
});

ipcMain.on('ReciteWordsApp', (event: any, fun: string, ...paras: string[]) => {
    let parasStr: string = paras.join('`, `');
    if (paras.length >= 1) {
        parasStr = '`' + parasStr + '`';
    }

    let command: string = `myApp.myApp.${fun}(${parasStr})`;
    // let command: string = `globalVar.app.${fun}(${parasStr})`;
    // console.log("command: " + command);

    try {
        eval(command);
    }
    catch (e) {
        console.error(`Fail to exec ${command} because ${(e as Error).message}`);
    }

    // asynchronous-reply
    // event.reply('log', 'pong');
    event.returnValue = 'true';
});


ipcMain.on('contextMenu', (event: any, id: string) => {

    let sender = event.sender;

    switch (id) {
        case "word_input":
            const menu = new Menu();
            menu.append(new MenuItem({ label: '复制', role: 'copy' }));
            menu.append(new MenuItem({ label: '粘贴', role: 'paste' }));
            menu.append(new MenuItem({ label: '剪切', role: 'cut' }));
            menu.append(new MenuItem({ label: '全选', role: 'selectAll' }));

            const win = BrowserWindow.fromWebContents(event.sender);
            // const win = BrowserWindow.getCurrentWindow()
            if (win) {
                menu.popup({
                    window: win
                })
            }
            break;
    }

    event.returnValue = 'true';
});

*/

/* ipcMain.on('app', (event: any, fun: string, ...paras: string[]) => {
    let parasStr: string = paras.join('`, `');
    if (paras.length >= 1) {
        parasStr = '`' + parasStr + '`';
    }

    let command: string = `myApp.app.${fun}(${parasStr})`;
    // let command: string = `globalVar.app.${fun}(${parasStr})`;
    // console.log("command: " + command);

    try {
        const ret = eval(command);
        // asynchronous-reply
        event.reply('asynchronous-reply', ret);
    }
    catch (e) {
        console.error(`Fail to exec ${command} because ${(e as Error).message}`);
    }
}); */

ipcMain.handle("app", (event: any, fun: string, ...paras: string[]) => {
  console.debug(`${event}`);
  let parasStr: string = paras.join("`, `");
  if (paras.length >= 1) {
    parasStr = "`" + parasStr + "`";
  }

  const command: string = `myApp.app.${fun}(${parasStr})`;
  // let command: string = `globalVar.app.${fun}(${parasStr})`;
  // console.log("command: " + command);

  try {
    const ret = eval(command);
    return ret;
  } catch (e) {
    console.error(`Fail to exec ${command} because ${(e as Error).message}`);
  }
});
