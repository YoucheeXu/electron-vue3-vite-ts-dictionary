<template>
  <div class="dict_panel">
    <!--div class = "" id = "words_list_box"
            style = "overflow:auto; height:430px; width:201px; "-->
    <select id="words_list" size="25" style="border: none; height: 430px; width: 201px; display: none; float: left">
      <!-- <option selected>word 1</option> -->
      <!-- <option>word 2</option> -->
      <!-- <option>word 3</option> -->
      <!-- <option>word 4</option> -->
      <!-- <option>word 5</option> -->
    </select>
    <!--/div-->
    <div id="contents_box" class="" style="overflow-y: auto; height: 430px; width: 701px; float: left">
      <div class="Word" />
      <div id="tabContainer">
        <el-tabs v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit" @tab-click="clickTab">
          <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
            <!-- <div id="dictContent" v-html="props.dictContent"></div> -->
            <iframe :src="props.dictURL" style="position: relative; width: 701px; height: 314px" frameborder="0"
              marginwidth="0" marginheight="0" allowtransparency="true"></iframe>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <!-- /.contents_box -->
    <div class="top">
      <a onclick="window.scrollTo(0,0);" alt="Top" href="#top" title="TOP" style="color: #cc0000">TOP</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRootStore } from "@/stores/root";
import type { TabsPaneContext } from "element-plus";
import type { TabPaneName } from "element-plus";
import type { ITabInfo } from "@/stores/type";

const props = defineProps<{ dictURL: string }>();

const rootStore = useRootStore();
const rootState = rootStore.rootState;

let tabIndex = 2;
const editableTabsValue = ref("2");

/* const editableTabs = computed(async () => {
  const tabsInfos: ITabInfo[] = [];
  const tabs = await window.Electron.ipcRenderer.invoke('app', 'GetTabs');
  for (const key of tabs) {
    tabsInfos.push({
      title: "dict.Desc",
      name: key
    })
    tabIndex++;
  }
  editableTabsValue.value = tabsInfos[0].name;
  // rootState.curDictBase = tabsInfos[0].id;
  // console.log(`set curDictBase: ${rootState.curDictBase}`)
  console.log(tabsInfos);
  return tabsInfos;
}); */

/*const editableTabs = computed<ITabInfo[]>(() => {
    return window.electron.ipcRenderer.invoke('app', 'GetTabs').then((tabs: string[]) => {
        const tabsInfos: ITabInfo[] = [];
        for (const key of tabs) {
            tabsInfos.push({
                title: "dict.Desc",
                name: key
            })
            tabIndex++;
        }
        editableTabsValue.value = tabsInfos[0].name;
        // rootState.curDictBase = tabsInfos[0].id;
        // console.log(`set curDictBase: ${rootState.curDictBase}`)
        console.log(tabsInfos);
        return tabsInfos;
    });
});*/

/* const editableTabs = computed(() => {
  if (rootState.tabsInfo.length >= 1) {
    // console.log(rootState.tabsInfo);
    tabIndex = rootState.tabsInfo.length;
    const tabName = rootState.tabsInfo[0].name;
    editableTabsValue.value = tabName;
    rootState.curTab = tabName;
  }
  console.log(rootState.tabsInfo);
  return rootState.tabsInfo;
}); */

const editableTabs = ref<ITabInfo[]>([]);
watchEffect(() => {
  if (rootState.tabsInfo.length >= 1) {
    tabIndex = rootState.tabsInfo.length;
    const tabName = rootState.tabsInfo[0].name;
    editableTabsValue.value = tabName;
    rootState.curTab = tabName;
  }
  // console.log(rootState.tabsInfo);
  editableTabs.value = rootState.tabsInfo;
});

// TO-DO: Not implemented
const handleTabsEdit = (targetName: TabPaneName | undefined, action: "remove" | "add") => {
  if (action === "add") {
    const newTabName = `${++tabIndex}`;
    editableTabs.value.push({
      title: "New Tab",
      name: newTabName,
    });
    editableTabsValue.value = newTabName;
  } else if (action === "remove") {
    const tabs = editableTabs.value;
    let activeName = editableTabsValue.value;
    if (activeName === targetName) {
      tabs.forEach((tab, index) => {
        if (tab.name === targetName) {
          const nextTab = tabs[index + 1] || tabs[index - 1];
          if (nextTab) {
            activeName = nextTab.name;
          }
        }
      });
    }

    editableTabsValue.value = activeName;
    editableTabs.value = tabs.filter((tab) => tab.name !== targetName);
  }
};

const emit = defineEmits(["switchTab"]);

const clickTab = (pane: TabsPaneContext, ev: Event) => {
  // console.log(pane.paneName);
  console.debug(ev);
  const tab = pane.paneName as string;
  emit("switchTab", tab);
};

defineExpose({
  editableTabsValue,
});

</script>

<style scoped>
.dict_panel {
  position: absolute;
  display: inline;
  left: 0px;
  top: 143px;
  height: 370px;
  width: 701px;
  /* width: 100%; */
  margin: auto;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
