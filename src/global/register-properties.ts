import type { App } from "vue";
// import { formatUTCString } from "@/utils/date-format";

export default function registerPropertise(app: App) {
  app.config.globalProperties.$filters = {
    // formatTime(value: string) {
    //   return formatUTCString(value);
    // },
  };
}
