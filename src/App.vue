<template>
  <ElConfigProvider :locale="locale">
    <RouterView v-slot="props">
      <KeepAlive>
        <component :is="props.Component" />
      </KeepAlive>
    </RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
// import en from "element-plus/es/locale/en.mjs";
import { useRootStore } from "@/stores/root";

import type { ITabInfo } from "@/stores/type";

const locale = zhCn;

const rootStore = useRootStore();
const rootState = rootStore.rootState;

// window.electron.ipcRenderer.invoke('app', 'log', "info", "App Vue");

rootStore.GetTabs().then((tabs: ITabInfo[]) => {
  rootState.tabsInfo = tabs;
  // console.log(rootState.tabsInfo);
});
</script>

<style scoped></style>
