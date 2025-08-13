// import exp from "constants";
import * as fs from "fs";
// import jDataView from "jdataview";
import * as ADLER32 from "adler-32";
// import { ElStep } from "element-plus";

export function RemoveDir(dir: string) {
  if (fs.existsSync(dir) == true) {
    if (fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      files.forEach((file, index) => {
        console.debug(`${index}`);
        const currentPath = dir + "/" + file;
        if (fs.statSync(currentPath).isDirectory()) {
          RemoveDir(currentPath);
        } else {
          fs.unlinkSync(currentPath);
        }
      });
      fs.rmdirSync(dir);
    } else {
      fs.unlinkSync(dir);
    }
  }
}

export function pathExists(p: string): boolean {
  try {
    fs.accessSync(p);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

/**
 * 异步等待对象的生成，对象生成完成返回生成的对象
 * @param getter 对象的获取函数
 * @param checkInterval 检查粒度，ms
 * @param timeout 超时时间, ms
 */
export const asyncCheck = async <T>(getter: () => T, checkInterval = 100, timeout = 1000) => {
  return new Promise<T>((x) => {
    const check = (num = 0) => {
      const target = getter();
      if (target !== undefined && target !== null) {
        x(target);
      } else if (num > timeout / checkInterval) {
        // 超时
        x(target);
      } else {
        setTimeout(() => check(++num), checkInterval);
      }
    };
    check();
  });
};

/**
 * 扩展Date的Format函数
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * @param {[type]} fmt [description]
 */
/*
Date.prototype.Format = function (fmt: string) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
*/

/**
 * must no same element in array
 *
 * @export
 * @template T
 * @param {T[]} oldArray
 * @return {*}  {T[]}
 */
export function randomArray<T>(oldArray: T[]): T[] {
  const newArray: T[] = [];

  for (let i = 0, oldTotalLen = oldArray.length; i < oldTotalLen; ) {
    let currentRandom = Number((Math.random() * oldTotalLen).toFixed(0));
    if (currentRandom >= oldTotalLen) {
      currentRandom = oldTotalLen - 1;
    }
    if (!newArray.includes(oldArray[currentRandom])) {
      newArray.push(oldArray[currentRandom]);
      i++;
    }
  }
  return newArray;
}

export function randomArray2<T>(arr: T[]) {
  for (let i = 0, len = arr.length; i < len; i++) {
    const currentRandom = Number((Math.random() * (len - 1)).toFixed(0));
    const current = arr[i];
    arr[i] = arr[currentRandom];
    arr[currentRandom] = current;
  }
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
// let time1 = new Date().Format("yyyy-MM-dd");
// let time2 = new Date().Format("yyyy-MM-dd HH:mm:ss");
/*export function formatDate(date: Date, fmt: string): string {
    let o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S+": date.getMilliseconds() //毫秒
    };

    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (let k in o) {
    // for(const k of Object.keys(o))
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};*/

/*
Date.prototype.toLocaleString = function () {   // 重写日期函数格式化日期
    return `${this.getFullYear()}-${this.getMonth() + 1 >= 10 ? (this.getMonth() + 1) : '0' + (this.getMonth() + 1)}-${this.getDate() >= 10 ? this.getDate() : '0' + this.getDate()} ${this.getHours() >= 10 ? this.getHours() : '0' + this.getHours()}:${this.getMinutes() >= 10 ? this.getMinutes() : '0' + this.getMinutes()}:${this.getSeconds() >= 10 ? this.getSeconds() : '0' + this.getSeconds()}`;
};
Date.prototype.toLocaleDateString = function () {   // 重写日期函数格式化日期
    return `${this.getFullYear()}-${this.getMonth() + 1 >= 10 ? (this.getMonth() + 1) : '0' + (this.getMonth() + 1)}-${this.getDate() >= 10 ? this.getDate() : '0' + this.getDate()}`;
};
Date.prototype.toLocaleTimeString = function () {   // 重写日期函数格式化日期
    return `${this.getHours() >= 10 ? this.getHours() : '0' + this.getHours()}:${this.getMinutes() >= 10 ? this.getMinutes() : '0' + this.getMinutes()}:${this.getSeconds() >= 10 ? this.getSeconds() : '0' + this.getSeconds()}`;
};
console.info(now.toLocaleString()); // 2020-11-14 14:00:46
console.info(now.toLocaleDateString()); // 2020-11-14
console.info(now.toLocaleTimeString()); // 14:00:46
*/
// 2021-09-04
export function formatDate(data: Date): string {
  return `${data.getFullYear()}-${data.getMonth() + 1 >= 10 ? data.getMonth() + 1 : "0" + (data.getMonth() + 1)}-${data.getDate() >= 10 ? data.getDate() : "0" + data.getDate()}`;
}

// 2021-09-04 15:49:54
export function formatTime(data: Date): string {
  return `${data.getFullYear()}-${data.getMonth() + 1 >= 10 ? data.getMonth() + 1 : "0" + (data.getMonth() + 1)}-${data.getDate() >= 10 ? data.getDate() : "0" + data.getDate()} ${data.getHours() >= 10 ? data.getHours() : "0" + data.getHours()}:${data.getMinutes() >= 10 ? data.getMinutes() : "0" + data.getMinutes()}:${data.getSeconds() >= 10 ? data.getSeconds() : "0" + data.getSeconds()}`;
}

/*export function Bytes2Num(format: string, buf: Buffer, offset?: number, length?: number): number {
    let bLittleEndian = (format[0] == "<");
    // console.log(buf);
    // console.log(offset);
    // console.log(length);
    // console.log(bLittleEndian);
    if (offset === null) {
        offset = 0;
    }
    if (length === null) {
        length = buf.length;
    }
    let jdv = new jDataView(buf, offset, length, bLittleEndian);
    let typ = format[1];
    if (typ == "B") {
        return jdv.getUint8();
    } else if (typ == "H") {
        return jdv.getUint16();
    } else if (typ == "I" || typ == 'L') {
        return jdv.getUint32();
    } else if (typ == "Q") {
        let bigNum = jdv.getUint64();
        let value = bigNum.valueOf();
        // if (bigNum.hi > 0) {
        if (!Number.isSafeInteger(value)) {
            throw new Error(`${value} exceeds MAX_SAFE_INTEGER. Precision may be lost`);
        }
        return value;
    } else {
        throw new Error(`Don't support to convert to type of number: ${typ}`);
    }
}*/

export function Bytes2Num(format: string, buf: Buffer, offset?: number, length?: number): number {
  const bLittleEndian = format[0] == "<";
  const typ = format[1];
  // console.log(buf);
  // console.debug(`offset: ${offset}`);
  // console.debug(length);
  // console.debug(`bLittleEndian: ${bLittleEndian}`);
  // const ofs = 0;
  let num = 0;
  if (offset === null) {
    offset = 0;
  }
  if (length === null) {
    length = buf.length;
  }
  try {
    // let jdv = new DataView(buf.buffer, offset, length);
    // const jdv = new DataView(buf.buffer);
    const buffer = Buffer.from(buf);
    if (typ == "B") {
      return buffer.readUInt8(offset);
    } else if (typ == "H") {
      // return jdv.getUint16(ofs, bLittleEndian);
      if (bLittleEndian) {
        num = buffer.readUInt16LE(offset);
      } else {
        num = buffer.readUInt16BE(offset);
      }
      return num;
    } else if (typ == "I" || typ == "L") {
      // return jdv.getUint32(ofs, bLittleEndian);
      // console.debug(`ofs: ${ofs}`);
      // console.debug(`buf: ${buf.join()}`);
      // const num = jdv.getUint32(ofs, bLittleEndian);
      if (bLittleEndian) {
        num = buffer.readUInt32LE(offset);
      } else {
        num = buffer.readUInt32BE(offset);
      }
      // const num = new Uint32Array(buf.buffer)[0];
      // console.debug(`num: ${num}`);
      return num;
    } else if (typ == "Q") {
      // const jdv = new DataView(buf.buffer, offset, length);
      // // const jdv = new DataView(buf.buffer);
      // console.debug(`buf: ${buf.join()}`);
      // const bigNum = jdv.getBigUint64(ofs, bLittleEndian);
      // console.debug(`bigNum: ${bigNum}`);
      // let value = bigNum.valueOf();
      let bigNum: bigint;
      if (bLittleEndian) {
        bigNum = buffer.readBigUint64LE(offset);
      } else {
        bigNum = buffer.readBigUint64BE(offset);
      }
      // console.debug(`bigNum: ${bigNum}`);
      const num = Number(bigNum);
      // console.debug(`num: ${num}`);
      // if (bigNum.hi > 0) {
      // if (!Number.isSafeInteger(value)) {
      //     throw new Error(`${value} exceeds MAX_SAFE_INTEGER. Precision may be lost`);
      // }
      // return Number(value);
      return num;
    } else {
      throw new Error(`Don't support to convert to type of number: ${typ}`);
    }
  } catch (e) {
    throw new Error(`Fail to Bytes2Num ${buf}, because of ${e}`);
  }
}

export function Num2Bytes(format: string, num: number): Buffer {
  // let bLittleEndian = (format[0] == "<");
  const endian = format[0] == "<" ? "LE" : "BE";
  const typ = format[1];
  if (typ == "L") {
    const buf = Buffer.alloc(4);
    const fcn = `buf.writeUInt32${endian}(${num})`;
    eval(fcn);
    return buf;
  } else if (typ == "Q") {
    const buf = Buffer.allocUnsafe(8);
    const fcn = `buf.writeBigUInt64${endian}(64)`;
    eval(fcn);
    return buf;
  } else {
    throw new Error(`Don't support convert from type of number: ${typ}`);
  }
}

export function DecodeBytes(buf: Buffer, code = "utf-8"): string {
  const decoder = new TextDecoder(code);
  return decoder.decode(buf);
}

export function BufferConcat(firstBuf: Buffer, ...bufAry: Buffer[]): Buffer {
  let lenOfBuf = firstBuf.length;
  for (const buf of bufAry) {
    lenOfBuf += buf.length;
  }

  const c = Buffer.alloc(lenOfBuf);
  c.set(firstBuf);

  let offset = firstBuf.length;
  for (const buf of bufAry) {
    c.set(buf, offset);
    offset += buf.length;
  }
  return c;
}

export function Adler32FromBuffer(data: Buffer): number {
  // notice that adler32 returns signed value
  const retOfAdler32Sign = ADLER32.buf(data);
  const a = new Uint32Array([retOfAdler32Sign]);
  return a[0];
}
