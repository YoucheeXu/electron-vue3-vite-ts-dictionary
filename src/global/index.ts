import type { App } from "vue";
import registerElements from "./register-element";
// import registerPropertise from './register-properties'

export function globalRegister(app: App): void {
  app.use(registerElements);
  // app.use(registerPropertise);
}
