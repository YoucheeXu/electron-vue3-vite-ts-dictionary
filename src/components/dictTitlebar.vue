<template>
  <div class="title_panel titlebar">
    <div id="btn_menu2" class="dropdown">
      <!-- <button class="btn" type="button" id="btn_menu" data-toggle="dropdown" aria-haspopup="true"
                aria-expanded="false"></button> -->
      <imgButton3 id="btn_menu" img="./skin/menu_btn.bmp" :width="31" :height="21" @btn-cliked="onBtnCliked" />
      <!-- <div class="dropdown-menu dropdown-menu-right" id="sys_menu" aria-labelledby="btn_menu">
                <a class="dropdown-item active" href="#Action2">Another action</a>
            </div> -->
    </div>
    <div class="min_max_close fr">
      <!-- <button type="button" id="btn_min" style="border: none;"></button> -->
      <imgButton3 id="btn_min" img="./skin/minimize_btn.bmp" :width="33" :height="21" @btn-cliked="onBtnCliked" />
      <!-- <button type="button" id="btn_max" style="border: none;"></button> -->
      <imgButton3 id="btn_max" img="./skin/maxmize_btn.bmp" :width="33" :height="21" @btn-cliked="onBtnCliked" />
      <!-- <button type="button" id="btn_restore" style="border: none; display: none;"></button> -->
      <imgButton3 id="btn_restore" img="./skin/restore_btn.bmp" :width="33" :height="21" @btn-cliked="onBtnCliked" />
      <!-- <button type="button" id="btn_close" style="border: none;"></button> -->
      <imgButton3 id="btn_close" img="./skin/close_btn.bmp" :width="43" :height="21" @btn-cliked="onBtnCliked" />
    </div>
  </div>
</template>

<script setup lang="ts">
import imgButton3 from "./imgButton3.vue";

const emit = defineEmits(["quit", "minimize"]);

const onBtnCliked = (id: string) => {
  console.log(id + " was clicked!");
  switch (id) {
    case "btn_close":
      // this.WaitAsyncTasksFnshd(async () => {
      //     await this.Quit();
      // })
      emit("quit");
      break;
    case "btn_min":
      emit("minimize");
      break;
    default:
    // rootState.info(id);
  }
};
</script>

<style scoped>
.title_panel {
  background-color: #43a0ff;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 701px;
  /* width: 100%; */
  height: 35px;
  margin: auto;
  box-sizing: border-box;
  overflow: hidden;
}

#btn_menu {
  position: absolute;
  left: 560px;
  top: 1px;
}

#btn_min {
  position: absolute;
  left: 591px;
  top: 1px;
}

#btn_max {
  position: absolute;
  left: 624px;
  top: 1px;
}

#btn_restore {
  position: absolute;
  left: 624px;
  top: 1px;
}

#btn_close {
  position: absolute;
  left: 657px;
  top: 1px;
}
</style>
