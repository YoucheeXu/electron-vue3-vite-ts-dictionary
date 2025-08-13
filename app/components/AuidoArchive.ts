// AuidoArchive.ts
// import { fs, path } from "electron";
import * as fs from "fs";
import * as path from "path";
import { RemoveDir } from "../utils/utils";
import { ZipArchive } from "./ZipArchive";
// import { globalVar } from "../utils/globalInterface";

export class AuidoArchive {
  private _download: any = null;
  private _szAudioArchive: string;
  private _audioZip: ZipArchive;
  private _tempAudioDir: string;

  constructor(
    readonly _szName: string,
    readonly _srcFile: string,
    readonly _compression: string,
    readonly _compresslevel: string,
  ) {
    this._szAudioArchive = path.basename(_srcFile);
    // console.log(this._szAudioArchive);
    const filePath = path.dirname(_srcFile);
    const fileName = path.basename(_srcFile, ".zip");
    // console.log(fileName);
    this._tempAudioDir = path.join(filePath, fileName);
    // console.log(this._tempAudioDir);
    const _this = this;
    if (fs.existsSync(_this._tempAudioDir) == false) {
      fs.mkdir(_this._tempAudioDir, function (error) {
        if (error) {
          console.error(error);
          return false;
        }
        console.log("Success to create folder: " + _this._tempAudioDir);
      });
    }
    // gLogger.info("tempAudioDir: " + this._tempAudioDir);

    this._audioZip = new ZipArchive(_srcFile, _compression, _compresslevel);
  }

  public get szName() {
    return this._szName;
  }

  public get srcFile() {
    return this._srcFile;
  }

  public async Open() {
    return this._audioZip.Open();
  }

  public Close(): [boolean, string] {
    RemoveDir(this._tempAudioDir);
    if (fs.existsSync(this._tempAudioDir) == false) {
      return [true, `OK to remove ${this._tempAudioDir}`];
    } else {
      return [false, `Fail to remove ${this._tempAudioDir}`];
    }
  }

  public async query_audio(word: string): Promise<[number, string]> {
    const fileName = word[0] + "/" + word + ".mp3";
    const audioFile: string = path.join(this._tempAudioDir, word + ".mp3");
    let ret: boolean = false;
    let audio: Buffer;
    try {
      if (fs.existsSync(audioFile) == true) {
        return Promise.resolve([1, audioFile]);
      } else if (this._audioZip.bFileIn(fileName)) {
        [ret, audio] = await this._audioZip.readFileAsync(fileName);
        if (ret) {
          try {
            fs.writeFileSync(audioFile, audio);
          } catch (e) {
            return Promise.resolve([-1, (e as Error).message]);
          }
          return Promise.resolve([1, audioFile]);
        } else {
          return Promise.resolve([-1, `Fail to read ${word} in ${this._szAudioArchive}!`]);
        }
      } else {
        return Promise.resolve([0, audioFile]);
      }
    } catch (e) {
      return Promise.resolve([-1, (e as Error).message]);
    }
  }

  public set download(download: any) {
    this._download = download;
  }

  public get download() {
    return this._download;
  }

  // ret: number, typ: number, word: string, msg: string
  public CheckAndAddFile(audioFile: string): [number, number, string, string] {
    const word = path.basename(audioFile, ".mp3");
    const fileName = word[0] + "/" + word + ".mp3";
    const _this = this;
    // let gApp = globalVar.app;
    if (fs.existsSync(audioFile)) {
      const audio = fs.readFileSync(audioFile);
      fs.unlink(audioFile, () => {});
      _this._audioZip.addFile(fileName, audio);
      return [1, 2, word, audioFile];
    } else {
      console.log(audioFile + " doesn't exist");
      return [-1, 2, word, "Doesn't exist audio of " + word];
    }
  }

  public del_audio(word: string): boolean {
    const fileName = word[0] + "/" + word + ".mp3";
    return this._audioZip.delFile(fileName);
  }
}
