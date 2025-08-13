// WordsDict.ts
import { SQLiteDict } from "./SQLiteDict";

/*
CREATE TABLE [Words](
    [Word] CHAR(255) CONSTRAINT [PrimaryKey] PRIMARY KEY, 
    [USSymbol] CHAR(255),
    [UKSymbol] CHAR(255),
    [Level] CHAR(255),
    [Stars] TINYINT
);
*/
export class WordsDict extends SQLiteDict {
  public async Open() {
    super.Open(this._szSrcFile, "Words");
  }

  public async GetLevel(word: string): Promise<string> {
    const ret = await super.GetItem(word, "Level");
    if (ret) {
      return ret;
    } else {
      if (typeof ret != "undefined" && ret != 0) {
        console.log(`${word} has no Level`);
      } else {
        console.log(`no ${word}`);
      }
      return "";
    }
  }
  public async SetLevel(word: string, level: string): Promise<boolean> {
    return super.UpdateItem(word, "Level", level);
  }

  public async GetStar(word: string): Promise<number> {
    const ret = await super.GetItem(word, "Stars");
    if (ret) {
      return ret;
    } else {
      if (typeof ret != "undefined" && ret != 0) {
        console.log(`${word} has no Star`);
      } else {
        console.log(`no ${word}`);
      }
      return 0;
    }
  }
  public async SetStar(word: string, star: number): Promise<boolean> {
    return super.UpdateItem(word, "Stars", star);
  }
}
