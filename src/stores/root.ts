// import { ref } from "vue";
import { defineStore } from "pinia";
import type { ITabInfo } from "./type";

export interface IRootState {
  tabsInfo: ITabInfo[];
  curTab: string;
  curWord: string;
}

export const useRootStore = defineStore("rootState", () => {
  const rootState: IRootState = {
    tabsInfo: [],
    curTab: "",
    curWord: "",
  };

  async function Minimize(): Promise<void> {
    window.ipc.invoke("app", "Minimize");
  }

  async function Quit(): Promise<void> {
    window.ipc.invoke("app", "Quit");
  }

  async function GetTabs(): Promise<ITabInfo[]> {
    const tabs = await window.ipc.invoke("app", "GetTabs");
    // console.log(tabs);
    const tabsInfos: ITabInfo[] = [];
    for (const key of tabs) {
      tabsInfos.push({
        title: key,
        name: key,
      });
    }
    return tabsInfos;
  }

  async function QueryWord(word: string, tabId: string): Promise<[string, string, boolean, string, number]> {
    const [dictURL, audioURL, bNew, level, nStars] = await window.ipc.invoke("app", "QueryWord", word, tabId);
    return [dictURL, audioURL, bNew, level, nStars];
  }

  async function QueryNext(): Promise<string> {
    const word = await window.ipc.invoke("app", "QueryNext");
    return word;
  }

  async function QueryPrev(): Promise<string> {
    const word = await window.ipc.invoke("app", "QueryPrev");
    return word;
  }

  return { rootState, Minimize, Quit, GetTabs, QueryWord, QueryNext, QueryPrev };
});
