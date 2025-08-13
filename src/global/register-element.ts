import type { App } from "vue";

import "element-plus/dist/index.css";
import "element-plus/theme-chalk/base.css";

import { ElInput, ElTabs, ElTabPane } from "element-plus";

const components = [ElInput, ElTabs, ElTabPane];

export default function registerElements(app: App) {
  for (const component of components) {
    if (component.name) {
      app.component(component.name, component);
    }
  }
  // for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  //     app.component(key, component)
  // }
}
