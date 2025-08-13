// import { assert } from "console";
import { SQLite } from "./SQLite";

export class SQLiteDict {
  private dataBase?: SQLite;
  private tabName?: string;

  constructor(
    readonly _szName: string,
    readonly _szSrcFile: string,
  ) {}

  public get szSrcFile() {
    return this._szSrcFile;
  }

  public get szName() {
    return this._szName;
  }

  public async Open(dictSrc: string, tabName: string) {
    this.dataBase = new SQLite();
    this.tabName = tabName;
    await this.dataBase.Open(dictSrc);
  }

  public async ExistTable(tabName: string): Promise<boolean> {
    try {
      const sql = `SELECT COUNT(*) FROM sqlite_master WHERE TYPE = 'table' AND NAME = '${tabName}'`;
      const ret = await this.dataBase?.get(sql);

      if (ret) {
        const num = ret["count(*)"];
        if (num >= 1) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      } else {
        return Promise.reject(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.reject(false);
    }
  }

  public async NewTable(tabName: string, style: string): Promise<boolean> {
    try {
      const r = await this.dataBase?.run(`CREATE TABLE ${tabName}(${style})`);
      if (r) {
        console.log(`Table ${tabName} created`);
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.reject(false);
    }
  }

  public async ExistWord(word: string): Promise<boolean> {
    const sql = `SELECT COUNT(*) FROM ${this.tabName} WHERE Word = '${word}'`;
    try {
      const ret = await this.dataBase?.get(sql);

      if (ret) {
        const num = ret["count(*)"];
        if (num >= 1) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      } else {
        return Promise.resolve(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.reject(false);
    }
  }

  public async InsertItems(word: string, items: string, values: string): Promise<boolean> {
    // `INSERT INTO ${this.level} (Word, Familiar) VALUES (${entry})`
    const sql = `INSERT INTO ${this.tabName} (${items}) VALUES (${values})`;
    try {
      const r = await this.dataBase?.run(sql);
      if (r) {
        console.log(word + " was inserted.");
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.reject(false);
    }
  }

  public async DelWord(word: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tabName} WHERE Word='${word}'`;
    try {
      const r = await this.dataBase?.run(sql);
      if (r) {
        console.log(word + " was deleted.");
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(false);
    }
  }

  public async GetItem(word: string, item: string): Promise<any> {
    const sql = `SELECT ${item} FROM ${this.tabName} WHERE Word = '${word}'`;
    try {
      const ret = await this.dataBase?.get(sql, []);
      if (ret) {
        const anything = ret[item];
        return Promise.resolve(anything);
      } else {
        return Promise.resolve(false);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async GetItems(word: string): Promise<any> {
    const sql = `SELECT * FROM ${this.tabName} WHERE Word = '${word}'`;
    try {
      const anything = await this.dataBase?.get(sql, []);
      if (anything) {
        return Promise.resolve(anything);
      } else {
        return Promise.reject(false);
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(false);
    }
  }

  public async UpdateItem(word: string, item: string, value: any): Promise<boolean> {
    let sql = `UPDATE ${this.tabName} SET ${item}=${value}`;
    sql += ` WHERE Word='${word}'`;

    if (this.dataBase) {
      return await this.dataBase.run(sql);
    } else {
      return Promise.reject(false);
    }
  }

  public async UpdateItems(word: string, itemLst: string[], valueLst: string[]): Promise<boolean> {
    let sql = `UPDATE ${this.tabName} SET `;
    for (const i in itemLst) {
      const item = itemLst[i],
        value = valueLst[i];
      sql += `${item} = ${value}, `;
    }
    sql += `WHERE Word='${word}'`;

    if (this.dataBase) {
      return await this.dataBase.run(sql);
    } else {
      return Promise.reject(false);
    }
  }

  public async GetCount(tabName: string, where: string): Promise<number> {
    const sql = `SELECT COUNT(*) FROM ${tabName} WHERE ${where}`;
    try {
      const ret = await this.dataBase?.get(sql);
      if (ret) {
        const num = ret["count(*)"];
        return Promise.resolve(num);
      } else {
        return Promise.reject(-1);
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(-1);
    }
  }

  public async GetWordsLst(wdsLst: string[], lvl: string): Promise<boolean> {
    const sql = "select Word,Level from Words";
    try {
      const r = await this.dataBase?.each(sql, [], function (row: any) {
        // console.log("Word: ", row.Word, " Level: ", row.Level);
        if (row.Level != null) {
          if (row.Level.length > 0) {
            const lvlLst = row.Level.split(";");
            const index = lvlLst.indexOf(lvl);
            if (index != -1) {
              wdsLst.push(row.Word);
            }
          }
        }
      });

      if (r) {
        if (wdsLst.length >= 1) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      } else {
        return Promise.reject(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.reject(false);
    }
  }

  public async Close(): Promise<[boolean, string]> {
    try {
      const ret = await this.dataBase?.Close();
      if (ret) {
        return [true, ""];
      } else {
        return [false, "Unkown reason"];
      }
    } catch (e) {
      return [false, (e as Error).message];
    }
  }
}
