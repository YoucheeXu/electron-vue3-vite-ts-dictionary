// ZipArchive.ts
// 将文件归档到zip文件，并从zip文件中读取数据

// https://stuk.github.io/jszip/documentation/howto/read_zip.html
import JSZip from "jszip";
import * as fs from "fs";
// import * as path from "path";
// import { asyncCheck, pathExists } from "../utils/utils";
import { pathExists } from "../utils/utils";

export class ZipArchive {
  private zip: JSZip = new JSZip();
  // private compression: string;
  // private compresslevel: string;
  private fileList: string[] = [];

  constructor(
    readonly zipFile: string,
    readonly compression: string = "",
    readonly compresslevel: string = "",
  ) {
    // this.zip = zipFile;
    // this.compression = compression;
    // this.compresslevel = compresslevel;
  }

  public async Open() {
    const _this = this;
    if (pathExists(_this.zipFile)) {
      return new JSZip.external.Promise((resolve, reject) => {
        fs.readFile(_this.zipFile, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }).then(function (data: any) {
        JSZip.loadAsync(data).then((zip) => {
          _this.zip = zip;
          _this.fileList = Object.keys(_this.zip.files);
        });
      });
    } else {
      return Promise.resolve(`There is no ${_this.zipFile}`);
    }
  }

  public addFile(fileName: string, datum: string | any): boolean {
    try {
      // with ZipFile(this.zip, 'a', ZIP_DEFLATED, compresslevel = 2) as zipf:
      // zipf.writestr(fileName, datum)
      /*let contentPromise = new JSZip.external.Promise(function (resolve, reject) {
                fs.readFile(fileName, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
            this.zip.file(fileName, contentPromise);
            */
      this.zip.file(fileName, datum);
      this.zip
        .generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: {
            level: 2,
          },
        })
        .then((content) => {
          fs.writeFile(this.zipFile, content, (err) => {
            if (err) {
              console.error(`Fail to save ${fileName}!`);
            } else {
              console.info(`Success to save ${fileName}!`);
            }
          });
        });
    } catch (e) {
      if (e instanceof Error) {
        return false;
      } else {
        // if we can't figure out what what we are dealing with then
        // probably cannot recover...therefore, rethrow
        // Note to Self: Rethink my life choices and choose better libraries to use.
        throw e;
      }
    }
    // fileName = os.path.basename(filePath)
    this.fileList.push(fileName);
    return true;
  }

  public bFileIn(fileName: string): boolean {
    // if (fileName in this.fileList) {
    if (this.fileList.indexOf(fileName) != -1) {
      return true;
    } else {
      return false;
    }
  }

  public searchFile(pattern: string, wdMatchLst: string[], limit: number): number {
    // let regex = re.compile(pattern);
    // for (let word of this.fileList) {
    // 	// gLogger.info(word);
    // 	match = regex.search(word);
    // 	if match{
    // 		wdMatchLst.push(word);
    // 	}
    // }
    let i = 0;
    const regex: RegExp = new RegExp(pattern);
    for (const word of this.fileList) {
      if (i >= limit) {
        break;
      } else if (regex.test(word)) {
        wdMatchLst.push(word);
        i++;
      }
    }
    return wdMatchLst.length;
  }

  public readFileSync(fileName: string): [boolean, string] {
    if (this.bFileIn(fileName) == false) {
      return [false, `%{fileName} desn't exist.`];
    }
    try {
      this.zip
        .file(fileName)!
        .async("blob")
        .then((content) => {
          return [true, content];
        });
    } catch (e) {
      return [false, (e as Error).message];
    }

    return [false, "Unkown Error!"];
  }

  public readFilePromise(fileName: string): [boolean, string | null] {
    if (this.bFileIn(fileName) == false) {
      return [false, null];
    }

    const promise1 = new Promise((resolve, reject) => {
      this.zip
        .file(fileName)!
        .async("string")
        .then((datum) => {
          resolve(datum);
        });
      reject(false);
    });

    promise1.then((content) => {
      return [true, content];
    });

    // asyncCheck
    return [false, "Unkown Error!"];
  }

  public async readFileAsync(fileName: string): Promise<[boolean, Buffer]> {
    return new Promise<[boolean, Buffer]>((resolve, reject) => {
      this.zip
        .file(fileName)!
        .async("nodebuffer")
        .then(
          (datum) => {
            resolve([true, datum]);
          },
          (reason) => {
            reject([false, reason]);
          },
        );
    });
  }

  public readFile(fileName: string, callback: (ret: boolean, datum: string | any) => void): void {
    if (this.bFileIn(fileName) == false) {
      callback(false, null);
    }

    try {
      // with ZipFile(self.__zip, 'a', ZIP_DEFLATED, compresslevel = 2) as zipf:
      // 	file = zipf.read(fileName)
      this.zip
        .file(fileName)!
        .async("string")
        .then((content) => {
          callback(true, content);
        });
    } catch (e) {
      callback(false, (e as Error).message);
    }
  }

  public delFile(fileName: string): boolean {
    throw new Error("don't support to delete file: " + fileName);
    return false;
  }
}
