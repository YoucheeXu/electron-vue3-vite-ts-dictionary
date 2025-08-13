// MdPakage.ts
// To use the promise-based APIs:
// import * as fs from 'fs/promises';

// To use the callback and sync APIs:
import * as fs from "fs";
// import * as path from "path";

import { ripemd128 } from "../utils/ripemd128";
// import { Salsa20 } from "../utils/pureSalsa20";

// zlib compression is used for engine version >=2.0
import * as zlib from "zlib";

// LZO compression is used for engine version < 2.0
// import * as lzo from "lzo-decompress";

// import * as xml from "fast-xml-parser";
import { XMLParser } from "fast-xml-parser";

import { strict as assert } from "assert";

// import { globalVar } from "../utils/globalInterface";
import { Bytes2Num, Num2Bytes, BufferConcat, Adler32FromBuffer } from "../utils/utils";

// read from mdd, mdx
export class MdPakage {
  private _fd: any;
  private _posOfFd = 0;

  private _version!: number;
  private _encoding: string;
  private _bSubstyle: boolean;

  private _encrypt: number = 0;

  private _stylesheet = new Map();
  // private _recordBlockOffset: any;
  private _formatOfNumber!: string;

  // private _keyBlockOffset: any;
  private _numOfEntries!: number;

  private _numOfWidth!: number;

  private _keyList = new Array<[number, Uint8Array]>();

  // <word, [recordStart, recordEnd, compressBlockStart, compressedSize, decompressedSize]>;
  private _recordMap = new Map<string, [number, number, number, number, number]>();
  private _recordList!: string[];

  private _tagOfHeader: any;

  constructor(
    readonly _szSrcFile: string,
    readonly _bMdd = false,
    encoding: string,
    readonly _passcode?: [string, string],
  ) {
    this._encoding = encoding.toUpperCase();
    this._bSubstyle = false;
  }

  public async Open() {
    this._fd = fs.openSync(this._szSrcFile, "r");

    if (this._fd == -1) {
      throw new Error(`Can't open ${this._szSrcFile}`);
    }

    this._tagOfHeader = this.ReadHeader();
    // console.debug('Finish to ReadHeader');

    this._keyList = await this.ReadKeys();
    // console.debug('Finish to ReadKeys');

    if (this._bMdd) {
      await this.DecodeMddRecordBlock();
      // console.debug('Finish to DecodeMddRecordBlock');
    } else {
      await this.DecodeMdxRecordBlock();
      // console.debug('Finish to DecodeMdxRecordBlock');
    }

    this._recordList = Array.from(this._recordMap.keys());
  }

  public bRecordIn(key: string) {
    return this._recordList.indexOf(key) != -1;
  }

  public async ReadRecord(key: string): Promise<[boolean, string]> {
    const value = this._recordMap.get(key);
    let recordStart = 0,
      recordEnd = 0,
      compressBlockStart = 0,
      compressBlcokSize = 0,
      decompressSize = 0;
    if (value) {
      recordStart = value[0];
      recordEnd = value[1];
      compressBlockStart = value[2];
      compressBlcokSize = value[3];
      decompressSize = value[4];
    } else {
      return Promise.resolve([false, `There is no ${key} in ${this._szSrcFile}`]);
    }

    // this._fd.seekSync(compressBlockStart);
    const recordBlockCompressed = this.ReadBuffer(compressBlcokSize, compressBlockStart);
    // 4 bytes indicates block compression type
    const recordBlockType = recordBlockCompressed.slice(0, 4);
    // 4 bytes adler checksum of uncompressed content
    const adler32 = Bytes2Num(">I", recordBlockCompressed.slice(4, 8));
    console.log(`adler32: ${adler32}`);

    // let recordBlock: Buffer;
    const recordBlockTypeStr = recordBlockType.join();
    const recordBlock = await this.Decompress(recordBlockTypeStr, recordBlockCompressed, decompressSize);

    // notice that adler32 return signed value
    assert(Adler32FromBuffer(recordBlock) == adler32);

    assert(recordBlock.length == decompressSize);

    const recordRaw = recordBlock.slice(recordStart, recordEnd);
    let record = "";

    if (!this._bMdd) {
      // convert to utf-8
      record = new TextDecoder(this._encoding).decode(recordRaw);
      // record = record.trim('\x00');
      // substitute styles
      if (this._bSubstyle && this._stylesheet) {
        record = this.SubstituteStylesheet(record);
      }
    } else {
      // record = String(recordRaw);
      // convert to utf-8
      record = new TextDecoder("GB18030").decode(recordRaw);
    }

    return Promise.resolve([true, record]);
  }

  public searchFile(pattern: string, wdMatchLst: string[], limit: number): number {
    let i = 0;
    const regex = new RegExp(pattern);
    for (const word of this._recordList) {
      if (i >= limit) {
        break;
      } else if (regex.test(word)) {
        wdMatchLst.push(word);
        i++;
      }
    }
    return wdMatchLst.length;
  }

  public CheckAndAddRecord(word: string, record: string): void {
    throw new Error(`Don't support to add record: ${word}, ${record}`);
  }

  public del_word(word: string): boolean {
    throw new Error("Don't support to delete word: " + word);
  }

  public async Close(): Promise<[boolean, string]> {
    let ret = false;
    let msg = "";
    try {
      fs.closeSync(this._fd);
      ret = true;
    } catch (e) {
      msg = (e as Error).message;
    }

    return [ret, msg];
  }

  private ReadHeader() {
    // let num = 0;
    // number of bytes of header text, big-endian, integer
    const bufOfSizeOfHeader = this.ReadBuffer(4);
    // console.debug(`sizeOfHeaderRaw = ${bufOfSizeOfHeader.join()}`);

    const sizeOfHeader = Bytes2Num(">I", bufOfSizeOfHeader);
    // console.debug(`sizeOfHeader = ${sizeOfHeader}`);

    const bufOfBytesOfHeader = this.ReadBuffer(sizeOfHeader);

    // 4 bytes: adler32 checksum of header, in little endian
    const bufOfAdler32 = this.ReadBuffer(4);
    // console.debug(`adler32Raw = ${ bufOfAdler32.join() }`);
    const adler32 = Bytes2Num("<I", bufOfAdler32);
    // console.debug(`adler32 = ${ adler32 }`);
    assert(adler32 == Adler32FromBuffer(bufOfBytesOfHeader));

    // mark down key block offset
    // this._keyBlockOffset = this._posOfFd;
    // console.debug(`offsetOfKeyBlk = ${ this._posOfFd }`);

    // header text in utf-16 encoding ending with '\x00\x00'
    const decoder = new TextDecoder("UTF-16LE");
    const textOfHeader = decoder.decode(bufOfBytesOfHeader.slice(-2).buffer);
    // console.debug(`textOfHeader = ${textOfHeader}`);
    const tagOfheader = this.ParseHeader(textOfHeader);
    if (!tagOfheader) {
      throw new Error("Fail to decode tagOfheader of " + this._szSrcFile);
    }
    // console.debug(tagOfheader)

    if (!this._encoding) {
      let encoding = tagOfheader["Encoding"];
      if (["GBK", "GB2312"].indexOf(encoding) != -1) {
        encoding = "GB18030";
      }
      this._encoding = encoding;
    }
    // console.debug(`Encoding = ${ this._encoding }`);

    // encryption flag
    //   0x00 - no encryption
    //   0x01 - encrypt record block
    //   0x02 - encrypt key info block
    const encrypted = tagOfheader.Encrypted;
    if (encrypted) {
      if (encrypted == "No") {
        this._encrypt = 0;
      } else if (encrypted == "Yes") {
        this._encrypt = 1;
      } else {
        this._encrypt = Math.round(encrypted);
      }
    }

    // console.debug(`Encrypted: ${ this._encrypt }`);

    // stylesheet attribute if present takes form of{
    //   style_number // 1-255
    //   style_begin  // or ''
    //   style_end	// or ''
    // store stylesheet in dict in the form of
    // {'number' : ('style_begin', 'style_end')}
    const styleSheet: string = tagOfheader.StyleSheet;
    if (styleSheet && styleSheet != "") {
      const lines = styleSheet.split(/[\r\n]/g);
      for (let i = 0; i < lines.length; i += 3) {
        this._stylesheet.set(lines[i], [lines[i + 1], lines[i + 2]]);
        this._bSubstyle = true;
      }
    } else {
      this._bSubstyle = false;
    }
    // console.debug("stylesheet = " + str(this._Stylesheet));

    // before version 2.0, number is 4 bytes integer
    // version 2.0 and above uses 8 bytes
    this._version = tagOfheader.GeneratedByEngineVersion;
    // console.debug(`version of Dict = ${ this._version }`);
    if (this._version < 2.0) {
      this._numOfWidth = 4;
      this._formatOfNumber = ">I";
    } else {
      this._numOfWidth = 8;
      this._formatOfNumber = ">Q";
    }

    return tagOfheader;
  }

  private Salsa_decrypt(ciphertext: Uint8Array, encrypt_key: Uint8Array) {
    // let temp = new Buffer.alloc(8); // "\x00" * 8
    // let s20 = new Salsa20(encrypt_key, temp, 8);
    // return s20.EncryptBytes(ciphertext);
    // console.debug(`ciphertext: ${ciphertext}, encrypt_key: ${encrypt_key}`);
    return Buffer.alloc(4);
  }

  private Decrypt_regcode_by_deviceid(reg_code: string, deviceid: string) {
    // console.debug(`reg_code: ${reg_code}, deviceid: ${deviceid}`)
    // let deviceid_digest = ripemd128(deviceid);
    // let temp = Buffer.alloc(8); // "\x00" * 8
    // let s20 = new Salsa20(deviceid_digest, temp, 8);
    // let encrypt_key = s20.EncryptBytes(reg_code);
    // return encrypt_key;
    return Buffer.alloc(4);
  }

  private Decrypt_regcode_by_email(reg_code: string, email: string) {
    // console.debug(`reg_code: ${reg_code}, deviceid: ${email}`)
    // let email_digest = ripemd128(email.decode().encode('utf-16-le'));
    // let temp = new Uint8Array(8); // "\x00" * 8
    // let s20 = new Salsa20(email_digest, temp, 8);
    // let encrypt_key = s20.EncryptBytes(reg_code);
    // return encrypt_key;
    return Buffer.alloc(4);
  }

  private async ReadKeys() {
    // this._fd.seekSyc(this._keyBlockOffset);

    // the following numbers could be encrypted
    let numOfBytes = 0;
    if (this._version >= 2.0) {
      numOfBytes = this._numOfWidth * 5;
    } else {
      numOfBytes = this._numOfWidth * 4;
    }

    let block = this.ReadBuffer(numOfBytes);

    if (this._encrypt & 1) {
      if (this._passcode == null) {
        throw new Error("user identification is needed to read encrypted file");
      }
      // let regcode, userid;
      const [regcode, userid] = this._passcode;
      // if isinstance(userid, unicode){
      //     userid = userid.encode('utf8');
      // }
      let encrypted_key;
      if (this._tagOfHeader["RegisterBy"] == "EMail") {
        encrypted_key = this.Decrypt_regcode_by_email(regcode, userid);
      } else {
        encrypted_key = this.Decrypt_regcode_by_deviceid(regcode, userid);
      }

      block = this.Salsa_decrypt(block, encrypted_key);
    }

    // decode this block
    let offset = 0;

    // number of key blocks
    const numOfKeyBlocks = Bytes2Num(this._formatOfNumber, block, offset, this._numOfWidth);
    // console.debug(`Number of Key Blocks = ${numOfKeyBlocks}`);

    // number of entries
    offset += this._numOfWidth;
    this._numOfEntries = Bytes2Num(this._formatOfNumber, block, offset, this._numOfWidth);
    // console.debug(`Number of Entries = ${this._numOfEntries}`);

    // number of bytes of key block info after decompression
    offset += this._numOfWidth;
    let sizeOfkeyBlockInfoDecomp = 0;
    if (this._version >= 2.0) {
      // Number of Bytes After Decompression
      sizeOfkeyBlockInfoDecomp = Bytes2Num(this._formatOfNumber, block, offset, this._numOfWidth);
      // console.debug(`Number of Bytes of key block info After Decompression = ${sizeOfkeyBlockInfoDecomp}`);
    }

    // number of bytes of key block info
    offset += this._numOfWidth;
    const sizeOfkeyBlockInfo = Bytes2Num(this._formatOfNumber, block, offset, this._numOfWidth);
    // console.debug(`Number of bytes of key block info = ${ sizeOfkeyBlockInfo }`);

    // number of bytes of key block
    offset += this._numOfWidth;
    const sizeOfKeyBlock = Bytes2Num(this._formatOfNumber, block, offset, this._numOfWidth);
    // console.debug(`Number of bytes of key block = ${sizeOfKeyBlock}`);

    // 4 bytes: adler checksum of previous 5 numbers
    if (this._version >= 2.0) {
      const adler32 = Bytes2Num(">I", this.ReadBuffer(4));
      // console.debug(`adler checksum of previous 5 numbers = ${adler32}`)
      assert(adler32 == Adler32FromBuffer(block));
    }

    // read key block info, which indicates key block's compressed and decompressed size
    const keyBlockInfo = this.ReadBuffer(sizeOfkeyBlockInfo);
    const keyBlockInfoList = await this.DecodeKeyBlockInfo(keyBlockInfo, sizeOfkeyBlockInfoDecomp);
    // console.debug('Finish to DecodeKeyBlockInfo');
    assert(numOfKeyBlocks == keyBlockInfoList.length);

    // read key block
    const keyBlockCompressed = this.ReadBuffer(sizeOfKeyBlock);
    // console.debug(`keyBlockCompressed = ${keyBlockCompressed.join()}`);

    // extract key block
    const keyList = await this.DecodeKeyBlocks(keyBlockCompressed, keyBlockInfoList);

    // this._recordBlockOffset = this._fd.tellSync();

    return keyList;
  }

  /*
    extract attributes from <Dict attr="value" ... >
    */
  private ParseHeader(textOfHeader: string) {
    const options = {
      attributeNamePrefix: "",
      ignoreAttributes: false,
    };
    try {
      // const jsonObj = xml.parse(textOfHeader, options, true);
      const parser = new XMLParser(options);
      const jsonObj = parser.parse(textOfHeader);
      // console.debug(jsonObj);
      if (this._bMdd) {
        return JSON.parse(JSON.stringify(jsonObj)).Library_Data;
      } else {
        return JSON.parse(JSON.stringify(jsonObj)).Dictionary;
      }
    } catch (e) {
      console.log((e as Error).message);
    }
  }

  private ReadBuffer(len: number, offset?: number): Buffer {
    const buf = Buffer.alloc(len);
    let pos: any;
    if (offset) {
      pos = offset;
    } else {
      pos = null;
      this._posOfFd += len;
    }
    const num = fs.readSync(this._fd, buf, 0, len, pos);
    assert(num == len);
    return buf;
  }

  private ReadNumber() {
    const buf = this.ReadBuffer(this._numOfWidth);
    return Bytes2Num(this._formatOfNumber, buf);
  }

  private async DecodeKeyBlockInfo(keyBlockInfoCompressed: Buffer, sizeOfKeyBlockInfoDecomp: number) {
    // let keyBlockInfo = Buffer.alloc(sizeOfKeyBlockInfoDecomp);
    let keyBlockInfo: Buffer;
    if (this._version >= 2) {
      const typOfCompr = keyBlockInfoCompressed.slice(0, 4).join();
      // console.debug(`Type of compression of keyBlockInfo = ${ typOfCompr }`);
      assert(typOfCompr == "2,0,0,0"); // zlib compression, \x02\x00\x00\x00
      // decrypt if needed
      let infoOfKeyBlockDecrypted: Buffer;
      // console.debug(`keyBlockInfoCompressed = ${keyBlockInfoCompressed.join()}`);
      if (this._encrypt & 0x02) {
        infoOfKeyBlockDecrypted = this.MdxDecrypt(keyBlockInfoCompressed);
      } else {
        infoOfKeyBlockDecrypted = keyBlockInfoCompressed;
      }

      // console.debug(`infoOfKeyBlockDecrypted = ${infoOfKeyBlockDecrypted.join()}`);
      keyBlockInfo = await this.Decompress(typOfCompr, infoOfKeyBlockDecrypted, sizeOfKeyBlockInfoDecomp);
      // console.debug(`keyBlockInfo = ${keyBlockInfo}`);

      // adler checksum
      const adler32 = Bytes2Num(">I", keyBlockInfoCompressed.slice(4, 8));
      // console.debug(`adler32 of keyBlockInfo = ${adler32}`);
      assert(adler32 == Adler32FromBuffer(keyBlockInfo));
    } else {
      // no compression and encrypt
      keyBlockInfo = keyBlockInfoCompressed;
    }
    // console.debug(`keyBlockInfo = ${keyBlockInfo.join()}`);
    // decode
    const keyBlockInfoList = new Array<[number, number]>(); // [sizeOfKeyBlkCompreSize, sizeOfKeyBlkDecomprSize]
    let numEntries = 0;
    let i: number = 0;
    let byteFormat;
    let byteWidth;
    let sizeOfTextTerm;
    if (this._version >= 2) {
      byteFormat = ">H";
      byteWidth = 2;
      sizeOfTextTerm = 1;
    } else {
      byteFormat = ">B";
      byteWidth = 1;
      sizeOfTextTerm = 0;
    }

    const lenOfKeyBlockInfo = keyBlockInfo.length;
    // console.debug(`lenOfKeyBlockInfo = ${lenOfKeyBlockInfo}`);
    while (i < lenOfKeyBlockInfo) {
      // console.debug(`strt: ${i}, end: ${i + byteWidth}`);
      // number of entries in current key block
      numEntries += Bytes2Num(this._formatOfNumber, keyBlockInfo.subarray(i, i + this._numOfWidth));
      console.debug(`numEntries: ${numEntries}`);
      i += this._numOfWidth;
      // text head size
      // console.debug(`byteFormat: ${byteFormat}`);
      // console.debug(`strt: ${i}, end: ${i + byteWidth}`);
      // console.debug(`keyBlockInfo.subarray(i, i + byteWidth): ${keyBlockInfo.subarray(i, i + byteWidth)}`);
      const sizeOftextHead = Bytes2Num(byteFormat, keyBlockInfo.subarray(i, i + byteWidth));
      // console.debug(`sizeOftextHead: ${sizeOftextHead}`);
      i += byteWidth;
      // text head
      if (this._encoding != "UTF-16") {
        i += sizeOftextHead + sizeOfTextTerm;
      } else {
        i += (sizeOftextHead + sizeOfTextTerm) * 2;
      }
      // text tail size
      const textTailSize = Bytes2Num(byteFormat, keyBlockInfo.subarray(i, i + byteWidth));
      // console.debug(`textTailSize: ${textTailSize}`);
      i += byteWidth;
      // text tail
      if (this._encoding != "UTF-16") {
        i += textTailSize + sizeOfTextTerm;
      } else {
        i += (textTailSize + sizeOfTextTerm) * 2;
      }

      // console.debug(`this._formatOfNumber: ${this._formatOfNumber}`);

      // key block compressed size
      // console.debug(`sizeOfKeyBlkCompreSize_bytes: ${keyBlockInfo.subarray(i, i + this._numOfWidth).join()}`);
      const sizeOfKeyBlkCompreSize = Bytes2Num(this._formatOfNumber, keyBlockInfo.subarray(i, i + this._numOfWidth));
      // console.debug(`sizeOfKeyBlkCompreSize: ${sizeOfKeyBlkCompreSize}`);
      i += this._numOfWidth;
      // key block decompressed size
      // console.debug(`sizeOfKeyBlkDecomprSize_bytes: ${keyBlockInfo.subarray(i, i + this._numOfWidth).join()}`);
      const sizeOfKeyBlkDecomprSize = Bytes2Num(this._formatOfNumber, keyBlockInfo.subarray(i, i + this._numOfWidth));
      // console.debug(`sizeOfKeyBlkDecomprSize: ${sizeOfKeyBlkDecomprSize}`);
      i += this._numOfWidth;

      keyBlockInfoList.push([sizeOfKeyBlkCompreSize, sizeOfKeyBlkDecomprSize]);

      // assert(numEntries == this._numOfEntries)
    }
    // console.debug(`keyBlockInfoList = ${ keyBlockInfoList }`);
    return keyBlockInfoList;
  }

  private FastDecrypt(data: Buffer, key: Buffer): Buffer {
    let previous = 0x36;
    for (let i = 0; i < data.length; i++) {
      let t = ((data[i] >>> 4) | (data[i] << 4)) & 0xff;
      t = t ^ previous ^ (i & 0xff) ^ key[i % key.length];
      previous = data[i];
      data[i] = t;
    }
    // console.debug(`FastDecrypt = ${data.join()}`);
    return data;
  }

  private MdxDecrypt(compBlock: Buffer) {
    const tail = Num2Bytes("<L", 0x3695);
    // console.debug(`Tail of key of compBlock = ${tail.join()}`);
    const msg = compBlock.slice(4, 8);
    // console.debug(`msg = ${msg.join()}`);
    const key = ripemd128(BufferConcat(msg, tail));
    // console.debug(`Key of compBlock = ${key.join()}`);
    return BufferConcat(compBlock.slice(0, 8), this.FastDecrypt(compBlock.slice(8), key));
  }

  private async DecodeKeyBlocks(keyBlockCompressed: Buffer, keyBlockInfoList: Array<[number, number]>) {
    let keyList = new Array<[number, Uint8Array]>();
    let i = 0;
    for (const value of keyBlockInfoList) {
      const sizeOfcompressed = value[0];
      const sizeOfDecompressed = value[1];
      const start = i;
      const end = i + sizeOfcompressed;
      // 4 bytes : compression type
      const keyBlockType = keyBlockCompressed.subarray(start, start + 4);
      const keyBlockTypeStr = keyBlockType.join();
      // console.debug(`keyBlockTypeStr: ${keyBlockTypeStr}`);

      // 4 bytes : adler checksum of decompressed key block
      const adler32 = Bytes2Num(">I", keyBlockCompressed.subarray(start + 4, start + 8));

      // console.debug(`strt: ${start}, end: ${end}`);
      // console.debug(`keyBlockCompressed.subarray(start, end): ${keyBlockCompressed.subarray(start, end).join()}`);
      const keyBlock = await this.Decompress(
        keyBlockTypeStr,
        keyBlockCompressed.subarray(start, end),
        sizeOfDecompressed,
      );
      // console.debug(`keyBlock: ${keyBlock.join()}`);
      assert(adler32 == Adler32FromBuffer(keyBlock));

      // extract one single key block into a key list
      const keyList1 = this.DecodeKeyBlock(keyBlock);
      keyList = keyList.concat(keyList1);

      i += sizeOfcompressed;
    }
    // console.debug(`len of keyList = ${ keyList.length }`);
    return keyList;
  }

  private DecodeKeyBlock(keyBlock: Buffer) {
    const keyList = new Array<[number, Uint8Array]>();
    let keyStartIndex = 0;
    let keyEndIndex = 0;
    while (keyStartIndex < keyBlock.length) {
      // the corresponding record's offset in record block
      const keyId = Bytes2Num(this._formatOfNumber, keyBlock.slice(keyStartIndex, keyStartIndex + this._numOfWidth));
      let delimiter;
      let width;
      // key text ends with '\x00'
      if (this._encoding == "UTF-16") {
        delimiter = "0,0"; // \x00\x00
        width = 2;
      } else {
        delimiter = "0"; // \x00
        width = 1;
      }
      let i = keyStartIndex + this._numOfWidth;
      while (i < keyBlock.length) {
        if (keyBlock.slice(i, i + width).join() == delimiter) {
          keyEndIndex = i;
          break;
        }
        i += width;
      }
      const keyTextRaw = keyBlock.slice(keyStartIndex + this._numOfWidth, keyEndIndex);
      const keyText1 = new TextDecoder(this._encoding).decode(keyTextRaw);
      // console.debug(`keyText1 = ${ keyText1 }`);
      // TODO: why encode?
      const keyText2 = new TextEncoder().encode(keyText1);
      keyStartIndex = keyEndIndex + width;
      keyList.push([keyId, keyText2]);
    }
    return keyList;
  }

  private async DecodeMddRecordBlock() {
    // this._fd.seekSync(this._recordBlockOffset);

    const numRecordBlocks = this.ReadNumber();
    const numEntries = this.ReadNumber();
    assert(numEntries == this._numOfEntries);
    const sizeOfRecordBlockInfo = this.ReadNumber();
    const sizeOfRecordBlock = this.ReadNumber();

    // record block info section
    const recordBlockInfoList: [number, number][] = [];
    let sizeCounter = 0;
    for (let i = 0; i < numRecordBlocks; i++) {
      const compressedSize = this.ReadNumber();
      const decompressedSize = this.ReadNumber();
      recordBlockInfoList.push([compressedSize, decompressedSize]);
      sizeCounter += this._numOfWidth * 2;
    }
    assert(sizeCounter == sizeOfRecordBlockInfo);

    // actual record block
    let offset = 0;
    let i = 0;
    sizeCounter = 0;
    for (const value of recordBlockInfoList) {
      const compressedSize = value[0];
      const decompressedSize = value[1];
      // let compressBlockStart = this._fd.tellSync();
      const compressBlockStart = this._posOfFd;
      const recordBlockCompressed = this.ReadBuffer(compressedSize);
      // 4 bytes: compression type
      const recordBlockType = recordBlockCompressed.slice(0, 4);
      // 4 bytes: adler32 checksum of decompressed record block
      const adler32 = Bytes2Num(">I", recordBlockCompressed.slice(4, 8));

      const recordBlockTypeStr = recordBlockType.join();
      const recordBlock = await this.Decompress(recordBlockTypeStr, recordBlockCompressed, decompressedSize);
      // notice that adler32 return signed value
      assert(adler32 == Adler32FromBuffer(recordBlock));

      assert(recordBlock.length == decompressedSize);

      // split record block according to the offset info from key block
      const lenOfKeyList = this._keyList.length;
      // console.debug(`lenOfKeyList: ${lenOfKeyList}`);
      while (i < lenOfKeyList) {
        const value = this._keyList[i];
        const recordStart = value[0];
        const keyText = value[1];
        // reach the end of current record block
        if (recordStart - offset >= recordBlock.length) {
          break;
        }
        // record end index
        let recordEnd = 0;
        if (i < lenOfKeyList - 1) {
          recordEnd = this._keyList[i + 1][0];
        } else {
          recordEnd = recordBlock.length + offset;
        }
        i += 1;

        // yield keyText, data
        const txtOfKey = new TextDecoder("UTF-8").decode(keyText);
        this._recordMap.set(txtOfKey, [
          recordStart - offset,
          recordEnd - offset,
          compressBlockStart,
          compressedSize,
          decompressedSize,
        ]);
      }

      offset += recordBlock.length;
      sizeCounter += compressedSize;
    }
    assert(sizeCounter == sizeOfRecordBlock);
  }

  private async DecodeMdxRecordBlock() {
    // this._fd.seekSync(this._recordBlockOffset);
    // console.debug(`offsetOfRecordBlk = ${ this._posOfFd }`);
    const numOfRecordBlocks = this.ReadNumber();
    // console.debug(`Number of Record Blocks = ${ numOfRecordBlocks }`);

    const numEntries = this.ReadNumber();
    assert(numEntries == this._numOfEntries);

    const sizeOfRecordBlockInfo = this.ReadNumber();
    // console.debug(`sizeOfRecordBlockInfo = ${ sizeOfRecordBlockInfo }`);

    const sizeOfRecordBlock = this.ReadNumber();
    // console.debug(`sizeOfRecordBlock = ${ sizeOfRecordBlock }`);

    // console.debug(`mid of file = ${ this._posOfFd }`);

    // record block info section
    const recordBlockInfoList = new Array<[number, number]>();
    let sizeCounter = 0;
    for (let i = 0; i < numOfRecordBlocks; i++) {
      const sizeOfcompressed = this.ReadNumber();
      const sizeOfDecompressed = this.ReadNumber();
      recordBlockInfoList.push([sizeOfcompressed, sizeOfDecompressed]);
      sizeCounter += this._numOfWidth * 2;
    }
    assert(sizeCounter == sizeOfRecordBlockInfo);

    // actual record block data
    let offset = 0;
    let i = 0;
    sizeCounter = 0;
    for (const value of recordBlockInfoList) {
      const sizeOfCompressed = value[0];
      const sizeOfDecompressed = value[1];

      const strtOfComprBlk = this._posOfFd;
      // console.debug(`strtOfComprBlk = ${ strtOfComprBlk }`);
      const recordBlockCompressed = this.ReadBuffer(sizeOfCompressed);
      // 4 bytes indicates block compression type
      const recordBlockType = recordBlockCompressed.slice(0, 4);
      // 4 bytes adler checksum of uncompressed content
      const adler32 = Bytes2Num(">I", recordBlockCompressed.slice(4, 8));

      const recordBlockTypeStr = recordBlockType.join();
      const recordBlock = await this.Decompress(recordBlockTypeStr, recordBlockCompressed, sizeOfDecompressed);

      // notice that adler32 return signed value
      assert(adler32 == Adler32FromBuffer(recordBlock));

      assert(recordBlock.length == sizeOfDecompressed);

      // split record block according to the offset info from key block
      // for word, recordStart in this._KeyDict.items(){
      while (i < this._keyList.length) {
        const value = this._keyList[i];
        const recordStart = value[0];
        const keyText = value[1];
        let recordEnd;
        // reach the end of current record block
        if (recordStart - offset >= recordBlock.length) {
          break;
        }
        // record end index
        if (i < this._keyList.length - 1) {
          recordEnd = this._keyList[i + 1][0];
        } else {
          recordEnd = recordBlock.length + offset;
        }
        i += 1;

        const txtOfKey = new TextDecoder("UTF-8").decode(keyText);
        this._recordMap.set(txtOfKey, [
          recordStart - offset,
          recordEnd - offset,
          strtOfComprBlk,
          sizeOfCompressed,
          sizeOfDecompressed,
        ]);
      }

      offset += recordBlock.length;
      sizeCounter += sizeOfCompressed;
    }
    assert(sizeCounter == sizeOfRecordBlock);
  }

  //TODO
  private SubstituteStylesheet(txt: string) {
    // substitute stylesheet definition
    // let txt_list = txt.split('`\d + `');
    // let txt_tag = re.findall('`\d + `', txt);
    // let txt_styled = txt_list[0];
    // let style: string[] = new Array;
    // for (j, p in enumerate(txt_list.slice(1))) {
    //     style = this._stylesheet[txt_tag[j].slice(1, -1)];
    // }

    // if (p && p[-1] == '\n') {
    //     txt_styled = txt_styled + style[0] + p.rstrip() + style[1] + '\r\n';
    // } else {
    //     txt_styled = txt_styled + style[0] + p + style[1];
    // }
    // return txt_styled;
    // throw new Error(`Don't implement SubstituteStylesheet: ${txt}`);
    return txt;
  }

  private async Decompress(typOfCompr: string, blkOfCompr: Buffer, sizeOfDecompr: number): Promise<Buffer> {
    // console.debug(`typOfCompr: ${typOfCompr}`);
    if (typOfCompr == "0,0,0,0") {
      // no compression, \x00\x00\x00\x00
      Promise.resolve(blkOfCompr.slice(8));
    } else if (typOfCompr == "1,0,0,0") {
      // lzo compression, \x01\x00\x00\x00
      // let header = '\xf0' + pack('>I', sizeOfDecompr);
      const header = Buffer.alloc(5);
      header[0] = 0xf0;
      header.set(Num2Bytes(">I", sizeOfDecompr), 1);
      // recordBlock = lzo.decompress(header + blkOfCompr.slice(8,));
      // return new Promise((resolve, reject) => {
      // });
      Promise.reject("Don't support lzo right now");
    } else if (typOfCompr == "2,0,0,0") {
      // zlib compression, \x02\x00\x00\x00
      // console.debug(`${blkOfCompr.slice(8).toString()}`);
      // console.debug(`data to decompress: ${blkOfCompr.subarray(8).join()}`);
      return new Promise((resolve, reject) => {
        zlib.unzip(blkOfCompr.subarray(8), (error: Error | null, result: Buffer) => {
          if (!error) {
            assert(result.length == sizeOfDecompr);
            resolve(result);
          } else {
            // console.error(`Fail to decompress: ${blkOfCompr.subarray(8).join()}`);
            reject(`Fail to decompress: ${error.message} at ${error.stack}`);
          }
        });
      });
    }
    return Promise.reject(`Don't suport type of compression: ${typOfCompr}`);
  }
}
