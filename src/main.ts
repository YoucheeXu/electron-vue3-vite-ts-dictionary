import { createApp } from "vue";
import { createPinia } from "pinia";

import { globalRegister } from "@/global";

import App from "./App.vue";
import router from "./router";

// import './assets/dict-gui.css'

const pinia = createPinia();

const app = createApp(App);

app.use(globalRegister);
app.use(pinia);
app.use(router);

app.mount("#app");
