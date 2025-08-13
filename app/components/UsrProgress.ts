// import { assert } from "console";
import { SQLite } from "./SQLite";

// TODO: support create new dict and initialize it; support to reset level
/*
CREATE TABLE ${Level}(
    Word text NOT NULL PRIMARY KEY,
    Familiar REAL,
    LastDate DATE,
    NextDate DATE
);
*/
export class UsrProgress {
  private dataBase?: SQLite;
  private level?: string;
  private _srcFile?: string;

  public get srcFile() {
    return this._srcFile;
  }

  public async Open(srcFile: string, lvl: string) {
    this._srcFile = srcFile;
    this.dataBase = new SQLite();
    await this.dataBase.Open(srcFile);
    this.level = lvl;
    // print("progress of " + srcFile + "is OK to open!");
  }

  public async New(srcFile: string, lvl: string) {
    this.dataBase = new SQLite();
    await this.dataBase.Open(srcFile);
    const r = await this.dataBase.run(
      `CREATE TABLE ${lvl}(word text NOT NULL PRIMARY KEY, familiar REAL, lastdate DATE)`,
    );
    if (r) {
      console.log("Table created");
    }
  }

  public async ExistTable(lvl: string) {
    const sql = `select count(*) from sqlite_master where type='table' and name = '${lvl}'`;
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
  }

  public async NewTable(lvl: string) {
    const r = await this.dataBase?.run(
      `CREATE TABLE ${lvl}(Word text NOT NULL PRIMARY KEY, Familiar REAL, LastDate DATE, NextDate DATE)`,
    );
    if (r) {
      this.level = lvl;
      console.log("Table created");
    }
  }

  public async ExistWord(wd: string) {
    const sql = `select count(*) from ${this.level} where Word = '${wd}'`;
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
  }

  public async InsertWord(wd: string) {
    const entry = `'${wd}', 0`;
    const sql = `INSERT INTO ${this.level} (Word, Familiar) VALUES (${entry})`;
    console.debug(sql);
    const r = await this.dataBase?.run(sql);
    if (r) {
      console.log(wd + " was inserted.");
    }
  }

  public async DelWord(wd: string) {
    const sql = `DELETE FROM ${this.level} WHERE Word='${wd}'`;
    try {
      const r = await this.dataBase?.run(sql);
      if (r) {
        console.log(wd + " was deleted.");
      }
    } catch (e) {
      console.log(e);
    }
  }

  public async GetItem(word: string, item: string): Promise<any> {
    // let sql = "select " + item + " from Words where word = '" + word + "'";
    const sql = `select ${item} from ${this.level} where Word = '${word}'`;
    const ret = await this.dataBase?.get(sql, []);
    const anything = ret[item];
    if (ret) {
      return Promise.resolve(anything);
    } else {
      return Promise.reject(false);
    }
  }

  public GetLastDate(word: string): Promise<Date> {
    return Promise.resolve<Date>(this.GetItem(word, "LastDate"));
  }

  public GetFamiliar(word: string): Promise<number> {
    return Promise.resolve<number>(this.GetItem(word, "Familiar"));
  }

  public async GetCount(table: string, where: string): Promise<number> {
    // let sql = "select count(*) from Words where " + where;
    const sql = `select count(*) from ${table} where ${where}`;
    const ret = await this.dataBase?.get(sql);

    if (ret) {
      const num = ret["count(*)"];
      return Promise.resolve(num);
    } else {
      return Promise.reject(0);
    }
  }

  public GetAllCount(level: string): Promise<number> {
    // let where = "level = '" + level + "'";
    const where = "Familiar is not null";
    return this.GetCount(level, where);
  }
  public GetInProgressCount(level: string): Promise<number> {
    // let where = "level = '" + level + "' and familiar > 0";
    // let where = "LastDate is not null and cast (Familiar as real) < 10";
    const where = "cast (Familiar as real) < 10 and LastDate is not null";
    return this.GetCount(level, where);
  }
  public GetNewCount(level: string): Promise<number> {
    // let where = "level = '" + level + "' and LastDate is null ";
    const where = "LastDate is null and cast (Familiar as real) < 10";
    return this.GetCount(level, where);
  }
  public GetFnshedCount(level: string): Promise<number> {
    // let where = "level = '" + level + "' and familiar = 10";
    const where = "cast (Familiar as real) >= 10";
    return this.GetCount(level, where);
  }

  public async GetWordsLst(args: any[]) {
    const wdsLst: string[] = args[0];
    // let familiar: number = args[-2];
    let familiar: number;
    let limit: number;
    // get new words
    if (args.length == 2) {
      // (wdsLst, familiar);
      familiar = args[1];
      // let sql = "select * from Words where level = '" + level + "' and familiar = " + String(familiar);
      const sql = `select * from ${this.level} where cast (Familiar as real) = ${String(familiar)}`;
      await this.dataBase?.each(sql, [], (row: any) => {
        wdsLst.push(row);
      });
    } else if (args.length == 3) {
      // (wdsLst, familiar, limit);
      familiar = args[1];
      limit = args[2];
      // let sql = "select word from Words where level = '" + level + "' and familiar <= 0 and familiar >= " + String(familiar) + " limit " + String(limit);
      // let sql = "select * from Words where level = '" + level + "' and familiar = " + String(familiar) + " limit " + String(limit);
      const sql = `select * from ${this.level} where cast (Familiar as real) = ${String(familiar)} limit ${String(limit)}`;
      await this.dataBase?.each(sql, [], (row: any) => {
        wdsLst.push(row);
      });
    }
    // get ancient words
    // get forgotten words
    else if (args.length == 4) {
      // (wdsLst, lastlastdate, familiar, limit);
      const lastlastdate = args[1];
      familiar = args[2];
      limit = args[3];
      // let sql = "select * from Words where level = '" + level + "' and lastdate <= date('" + lastlastdate + "') and familiar < " + String(familiar);
      let sql = `select * from ${this.level} where lastdate <= date('${lastlastdate}') and cast (Familiar as real) < ${String(familiar)}`;
      sql += " limit " + String(limit);

      // this.dataBase.GetWordsLst(wdsLst, where);
      await this.dataBase?.each(sql, [], (row: any) => {
        wdsLst.push(row);
      });
    }
    // get Ebbinghaus Forgetting Curve words
    else if (args.length == 5) {
      // (wdsLst, lastdate, lastlastdate, familiar, limit);
      const lastdate = args[1];
      const lastlastdate = args[2];
      familiar = args[3];
      limit = args[4];

      // let sql = "select * from Words where level = '" + level + "' and lastdate <= date('" + lastdate + "') and lastdate >= date('" + lastlastdate + "') and familiar < " + String(familiar);
      // let sql = "select * from Words where level = '" + level + "' and lastdate <= date('" + lastdate + "') and lastdate >= date('" + lastlastdate + "') and cast (Familiar as real) < " + String(familiar);
      let sql = `select * from ${this.level} where lastdate <= date('${lastdate}') and lastdate >= date('${lastlastdate}') and cast (Familiar as real) < ${String(familiar)}`;
      sql += " limit " + String(limit);

      // this.dataBase.GetWordsLst(wdsLst, where);
      await this.dataBase?.each(sql, [], (row: any) => {
        wdsLst.push(row);
      });
    }

    if (wdsLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public async UpdateProgress(word: string, familiar: number, today: string): Promise<boolean> {
    // let entry = `'${String(familiar)}','date("${today}")'`;
    // let sql = "update Words(familiar, lastdate) values (" + entry + ")";

    // let sql = `update Words set Familiar=${familiar}, LastDate=date('${today}')`;
    let sql = `update ${this.level} set Familiar=${familiar}, LastDate=date('${today}')`;
    sql += ` where Word='${word}'`;

    /*let ret = this.dataBase.run(sql);

        ret.then((changes: number) => {
            console.info(`${changes} has changed!`);
        }, (reason) => {
            console.error(reason as string);
        })*/

    const ret = await this.dataBase?.run(sql);
    return ret ? ret : Promise.reject(false);
  }

  public async GetForgottenWordsLst(wdsLst: any[]) {
    const familiar = 0;
    const sql = `select * from ${this.level} where cast (Familiar as real) < ${String(familiar)}`;

    try {
      await this.dataBase?.each(sql, [], (row: any) => {
        wdsLst.push(row);
      });

      if (wdsLst.length >= 1) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public async GetOvrDueWordsLst(wdsLst: any[], today: string) {
    const familiar = 10;
    const sql = `select * from ${this.level} where NextDate < date('${today}') and cast (Familiar as real) < ${String(familiar)}`;

    await this.dataBase?.each(sql, [], (row: any) => {
      wdsLst.push(row);
    });

    if (wdsLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public async GetDueWordsLst(wdsLst: any[], today: string) {
    const familiar = 10;
    const sql = `select * from ${this.level} where NextDate = date('${today}') and cast (Familiar as real) < ${String(familiar)}`;

    await this.dataBase?.each(sql, [], (row: any) => {
      wdsLst.push(row);
    });

    if (wdsLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public async GetNewWordsLst(wdsLst: any[], limit: number) {
    const familiar = 0;

    let sql = `select * from ${this.level} where LastDate is null and cast (Familiar as real) = ${String(familiar)}`;
    sql += " limit " + String(limit);

    await this.dataBase?.each(sql, [], (row: any) => {
      wdsLst.push(row);
    });

    if (wdsLst.length >= 1) {
      return true;
    } else {
      return false;
    }
  }

  public async UpdateProgress2(word: string, familiar: number, lstDate: string, nxtDate: string): Promise<boolean> {
    let sql = `update ${this.level} set Familiar=${familiar}, LastDate=date('${lstDate}'), NextDate=date('${nxtDate}')`;
    sql += ` where Word='${word}'`;
    console.info(sql);

    if (this.dataBase) {
      return await this.dataBase.run(sql);
    } else {
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
