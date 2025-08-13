// SDictBase.ts
import * as path from "path";
import * as fs from "fs";
import { RemoveDir } from "../utils/utils";
import { DictBase } from "./DictBase";
import { SQLite } from "./SQLite";

/*
CREATE TABLE [Words](
    [Word] CHAR(255) CONSTRAINT [PrimaryKey] PRIMARY KEY, 
    [Symbol] CHAR(255), 
    [Meaning] CHAR(255), 
    [Sentences] TEXT
);
*/

export class SDictBase extends DictBase {
  private _dict: SQLite;

  constructor(name: string, dictSrc: string) {
    super(name, dictSrc);
    this._dict = new SQLite();

    const filePath = path.dirname(dictSrc);
    const fileName = path.basename(dictSrc, ".dict");

    const tmpDir = path.join(filePath, fileName);

    this.szTmpDir = tmpDir;

    const _this = this;
    if (fs.existsSync(_this.szTmpDir) == false) {
      fs.mkdir(_this.szTmpDir, function (error) {
        if (error) {
          console.log(error);
          return false;
        }
        console.log("Success to create folder: " + _this.szTmpDir);
      });
    }
  }

  public async Open() {
    this._dict.Open(this._szSrcFile);
  }

  public async Close(): Promise<[boolean, string]> {
    try {
      const ret = await this._dict.Close();
      if (ret) {
        // return [true, ""];
        RemoveDir(this.szTmpDir);
        if (fs.existsSync(this.szTmpDir) == false) {
          return [true, `OK to remove ${this.szTmpDir}`];
        } else {
          return [false, `Fail to remove ${this.szTmpDir}`];
        }
      } else {
        return [false, "Unkown reason"];
      }
    } catch (e) {
      return [false, (e as Error).message];
    }
  }

  // [symbol, meaning, sentences]
  public async query_word(word: string): Promise<[number, string]> {
    try {
      const dictFile = path.join(this.szTmpDir, word + ".html");
      if (fs.existsSync(dictFile) == true) {
        // html = fs.readFileSync(dictFile, { encoding: 'utf8', flag: 'r' });
        // return Promise.resolve([1, html]);
        return Promise.resolve([1, dictFile]);
      }
      const sql = "select * from Words where word=?";
      const r: any = await this._dict.get(sql, [word]);
      if (r === undefined) {
        return [-1, `${word} not in dict!`];
      } else {
        const html = `<!DOCTYPE html>
                <html>
                    <body>
                        <style type="text/css">
                            .text{
                                color: #0000FF;
                                /*text-transform:capitalize;*/
                                margin:10px auto 20px 0px;
                                font-size: 25pt;
                                font-weight: bold;
                            }
                            .phonetic{
                                /* margin:0px 0px 20px 10px; */
                                margin:0px 0px 0px 5px;
                                /*margin-top:-25px;*/
                                vertical-align:middle;
                                /*display: inline-block;
                                display: inline;*/
                            }
                            .meaning{
                                margin:10px 0px;
                                display: list-item;
                                list-style-type: decimal;
                            }
                            .example,.meaning{
                                display: list-item;
                                list-style-type: circle;
                                margin:7px auto auto 20px;
                                font-weight:normal;
                            }
                            .text, .sound, .phonetic{
                                display: inline-block;
                                display: inline;
                            }
                        </style>
                        <div class = 'text'>${word}</div>
                        <div class = 'phonetic'>[${r.Symbol}]</div>
                        <div class = 'meaning'>${r.Meaning}</div>
                        <div class = 'example'>${r.Sentences}</div>
                    </body>
                </html>`;
        fs.writeFileSync(dictFile, html);
        return [1, dictFile];
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      return [-1, errMsg];
    }
  }

  public async get_wordsLst(word: string, wdsLst: string[]): Promise<boolean> {
    // let sql = "select word from Words where word like '?%'";
    const sql = `select word from Words where word like '${word}%' limit 100`;

    // let r = await this._dict.all(sql, [word]);
    const r = await this._dict.all(sql);
    r.forEach((row: any) => {
      wdsLst.push(row.Word);
    });

    if (wdsLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public del_word(word: string): boolean {
    throw new Error(`del_word ${word} of ${this.szName} not implemented.`);
  }

  public CheckAndAddFile(localFile: string) {
    throw new Error(`CheckAndAddFile ${localFile} of ${this.szName} not implemented.`);
  }
}
