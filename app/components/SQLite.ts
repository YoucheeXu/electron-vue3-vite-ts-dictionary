// import { sqlite3 } from "sqlite3";

import * as sqlite3 from "sqlite3";
// const sqlite3 = require('sqlite3').verbose()

export class SQLite {
  private db?: sqlite3.Database;

  public Open(path: string): Promise<string> {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.db = new sqlite3.Database(path, (err: Error | null) => {
        if (err) {
          console.error("Open error: " + err.message);
          reject("Open error: " + err.message);
        } else {
          // console.log(path + " opened");
          resolve(path + " opened");
        }
      });
    });
  }

  // any query: insert/delete/update
  // run(sql: string, params: any, callback?: (this: RunResult, err: Error | null) => void): this;
  // run(sql: string, callback?: (this: RunResult, err: Error | null) => void): this;
  public run(query: string): Promise<boolean> {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.db?.run(query, (err: Error | null) => {
        if (err) {
          console.error(err.message);
          reject(err.message);
        } else {
          resolve(true);
        }
      });
    });
  }

  // first row read
  public get(query: string, params?: any): Promise<any> {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.db?.get(query, params, (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // set of rows read
  public all(query: string, params?: any): Promise<any> {
    const _this = this;
    return new Promise((resolve, reject) => {
      if (params === undefined) params = [];

      _this.db?.all(query, params, (err: Error | null, rows: any) => {
        if (err) {
          reject("Read error: " + err.message);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // each row returned one by one
  // each(sql: string, params: any, callback?: (this: Statement, err: Error | null, row: any) => void, complete?: (err: Error | null, count: number) => void): this;
  public each(query: string, params: any, action?: any): Promise<string | boolean> {
    const db = this.db;
    // console.log(query);
    return new Promise((resolve, reject) => {
      db?.serialize(() => {
        db.each(query, params, (err: Error | null, row: any) => {
          if (err) {
            reject("Read error: " + err.message);
          } else {
            if (row && action != undefined) {
              action(row);
            }
          }
        });
        db.get("", (err: Error | null, row: any) => {
          if (err) {
            reject("get error: " + err.message);
          }
          console.debug(row);
          resolve(true);
        });
      });
    });
  }

  public Close(): Promise<any> {
    const db = this.db;
    return new Promise((resolve, reject) => {
      db?.close((err: Error | null) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(true);
        }
      });
    });
  }

  /*
    public GetAll(word: string, txtLst: string[]) {
        let content;
        let command = "select * from Words where word = '" + word + "'";
        try {
            this.__cur.execute(command);
            content = this.__cur.fetchone();
        }
        catch (e) {
            console.log(command);
            console.log((e as Error).message);
        }
        if (content) {
            txtLst = txtLst.extend(content);
            return true;
        }
        else {
            let error = "can't find " + word;
            console.log(error);
            txtLst.push(error);
            return false;
        }
    }

    public GetItem(word: string, item: string) {
        let content;
        let command = "select " + item + " from Words where word = '" + word + "'";
        try {
            this.__cur.execute(command);
            content = this.__cur.fetchone();
        }
        catch (e) {
            console.log(command);
            console.log((e as Error).message);
        }
        return content[0];
    }

    public GetCount(where: string): number {
        let command = "select count(*) from Words where " + where;
        // console.log(command);
        this.__cur.execute(command);
        let number = this.__cur.fetchone()[0];;
        // console.log(number);
        return number;
    }

    public UpdateItem(word: string, item: string, v: string) {
        let command = "update Words set " + item + " = " + v + " where word = '" + word + "'";
        // console.log(command);
        this.__cur.execute(command);
        this.__conn.commit();
    }

    public Update(word: string, contDict: any) {
        //console.log(contDict);
        let command = "update Words set ";
        contDict.forEach((value: any, key: string) => {
            command = command + key + " = " + value + ", ";
        });
        command = command + "where word = '" + word + "'";
        command = command.replace(", where", " where");
        // console.log(command);
        this.__cur.execute(command);
        this.__conn.commit();
    }

    // public update_word(word, *content){
    // command = "update Words set ";
    // for keyword, value in content.items(){
    // //console.log ("%s => %r" % (keyword, value));
    // command = command + keyword + " = " + value + ", ";
    // command = command + "where word = '" + word + "'";
    // command = command.replace(", where", " where");
    // console.log(command);
    // os._exit(0);
    // this.__cur.execute(command);
    // this.__conn.commit();
    ;
    // public get_wordslst(wdsLst, level, familiar, limit){
    // command = "select word from Words where level = '" + level + "' and familiar = " + str(familiar) + " order by familiar limit " + str(limit);
    // console.log (command);
    // this.__cur.execute(command);
    // content = this.__cur.fetchall();;
    // if content{
    // wdsLst = wdsLst.extend(content);
    // return true;
    // else {
    // console.log("can't get wordslst.");
    // return false;

    public GetWordsLst(wdsLst: string[], where: string) {
        let command = "select word from Words where " + where;
        console.log(command);
        this.__cur.execute(command);
        content = this.__cur.fetchall();;
        if (content) {
            wdsLst = (wdsLst || []).concat(content);
            console.log(`Got wordslst: ${content.length}.`);
            return true;
        }
        else {
            console.log("can't get wordslst.");
            return false;
        }
    }
    public Close() {
        this.__cur.close();
        this.__conn.close();
    }

    public delFile(fileName: string): boolean {
        throw new Error("don't support to delete file: " + fileName);
        return false;
    }
    */
}
