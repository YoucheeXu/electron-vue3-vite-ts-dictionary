<template>
  <titlebar @quit="Quit" @minimize="Minimize" />
  <inputPanel ref="childInputRef" @query-word="QueryWord" @query-next="QueryNext" @query-prev="QueryPrev" />
  <wordPanel
    ref="childWordRef"
    :word="wordRef"
    :audio-u-r-l="audioURLRef"
    :b-new="bNewRef"
    :level="levelRef"
    :n-stars="nStarsRef"
  />
  <dictPanel ref="childDictRef" :dict-u-r-l="dictURLRef" @switch-tab="SwitchTab" />
  <bottomPanel />
</template>

<script setup lang="ts">
import { ref } from "vue";

// import { clearInterval } from "timers";

import { useRootStore } from "@/stores/root";

import titlebar from "@/components/dictTitlebar.vue";
import inputPanel from "@/components/dictInputPanel.vue";
import wordPanel from "@/components/dictWordPanel.vue";
import dictPanel from "@/components/dictDictPanel.vue";
import bottomPanel from "@/components/dictBottomPanel.vue";

const rootStore = useRootStore();
const rootState = rootStore.rootState;

const Minimize = () => {
  rootStore.Minimize();
};

const Quit = () => {
  rootStore.Quit();
};

const childInputRef = ref<InstanceType<typeof inputPanel> | null>(null);

const childWordRef = ref<InstanceType<typeof wordPanel> | null>(null);
const wordRef = ref("");
const audioURLRef = ref("");
const bNewRef = ref(false);
const levelRef = ref("");
const nStarsRef = ref(0);

const childDictRef = ref(null);
const dictURLRef = ref("");

const Pronounce = () => {
  const childWord = childWordRef.value;
  childWord?.Play();
};

const query_word = async (word: string, tabId: string) => {
  console.log(`query ${word} in ${tabId}`);
  console.log(`current word: ${rootState.curWord} tab: ${rootState.curTab}`);

  if (word == rootState.curWord && tabId == rootState.curTab) {
    Pronounce();
    return;
  }
  console.log(`word: ${word}, tabId: ${tabId}`);
  rootStore
    .QueryWord(word, tabId)
    .then(([dictURL, audioURL, bNew, level, nStars]: [string, string, boolean, string, number]) => {
      wordRef.value = word;
      dictURLRef.value = dictURL;
      audioURLRef.value = audioURL;
      bNewRef.value = bNew;
      levelRef.value = level;
      nStarsRef.value = nStars;
      Pronounce();
    });
  rootState.curWord = word;
  rootState.curTab = tabId;
};

// TO-DO: status of QueryPrev button
const QueryWord = async () => {
  if (childInputRef.value) {
    const childInput = childInputRef.value;
    const word = childInput.word;
    // const tabId = childDictRef.value.editableTabsValue;
    query_word(word, rootState.curTab);
  }
};

// TO-DO: status of button
const QueryNext = async () => {
  rootStore.QueryNext().then((word: string) => {
    query_word(word, rootState.curTab);
  });
};

// TO-DO: status of button
const QueryPrev = async () => {
  rootStore.QueryPrev().then((word: string) => {
    query_word(word, rootState.curTab);
  });
};

const SwitchTab = (tab: string) => {
  console.log(`switch to ${tab}`);
  if (childInputRef.value) {
    const word = childInputRef.value.word as string;
    if (word.length > 1) {
      query_word(word, tab);
    }
  }
  rootState.curTab = tab;
};
</script>

<style lang="less" scoped></style>
