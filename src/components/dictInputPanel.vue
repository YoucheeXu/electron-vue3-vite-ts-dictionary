<template>
  <div class="input_panel">
    <!-- <button type="button" id="btn_prev" disabled="disabled"></button> -->
    <imgButton4 id="btn_prev" img="./skin/prev_btn.bmp" :width="45" :height="37" @btn-cliked="onBtnCliked" />
    <!-- <button type="button" id="btn_next" disabled="disabled"></button> -->
    <imgButton4 id="btn_next" disabled="disabled" img="./skin/next_btn.bmp" :width="40" :height="37"
      @btn-cliked="onBtnCliked" />
    <form @submit.prevent="queryWord" class="input_box"
      style="width: 600px; height: 37px; background: url(./skin/combox_bk.bmp)">
      <!-- <input
        id="word_input"
        v-model="word"
        type="text"
        autofocus="true"
        style="width: 466px; height: 37px; border: 0px; background-color: transparent"
      /> -->
      <el-input v-model="word" ref="inputRef" style="width: 466px; height: 37px; border: 0px;"
        placeholder="Input word" />
      <!-- @keyup.enter.native="handleEnter" placeholder="Input word" /> -->
      <!-- <button type="button" id="btn_del" style="border: none;"></button> -->
      <imgButton3 id="btn_del" img="./skin/delete_item.bmp" :width="30" :height="34" @btn-cliked="onBtnCliked" />
      <!-- <button type="button" id="btn_drop" style="border: none;"></button> -->
      <imgButton3 id="btn_drop" img="./skin/combobox_drop_btn.bmp" :width="20" :height="34" @btn-cliked="onBtnCliked" />
      <!-- <button type="button" id="btn_lookup" style="border: none;"></button> -->
      <imgButton3 type="submit" id="btn_lookup" img="./skin/lookup_btn.bmp" :width="110" :height="37" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import imgButton3 from "./imgButton3.vue";
import imgButton4 from "./imgButton4.vue";
// import { useRootStore } from '@/stores/root';

// const rootStore = useRootStore();
// const rootState = rootStore.rootState;

// const word = defineModel();
const word = ref("");
const inputRef = ref();

const emit = defineEmits(["queryWord", "queryPrev", "queryNext"]);

const onBtnCliked = (id: string) => {
  // console.log(id + " was clicked!");
  switch (id) {
    case "btn_del":
      inputRef.value.clear();
      break;
    case "btn_prev":
      emit("queryPrev");
      break;
    case "btn_next":
      emit("queryNext");
      break;
    case "btn_lookup":
      emit("queryWord");
      break;
    default:
    // rootState.info(id);
  }
};

const queryWord = () => {
  emit("queryWord");
  inputRef.value.select();
}

defineExpose({
  word,
});
</script>

<style scoped>
.input_panel {
  position: absolute;
  left: 0px;
  top: 35px;
  width: 701px;
  /* width: 100%; */
  height: 48px;
  margin: auto;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f0f0f0;
}

#btn_prev {
  outline: none;
  border: none;
  position: relative;
  left: 10px;
  top: 10px;
}

/* #btn_prev:disabled{ */
/* background-position-x: -135px; */
/* } */

#btn_next {
  outline: none;
  border: none;
  position: absolute;
  left: 55px;
  top: 10px;
}

/* #btn_next:disabled{ */
/* background-position-x: -120px; */
/* } */

.input_box {
  position: absolute;
  top: 10px;
  left: 95px;
  width: 486px;
  height: 32px;
}

/* input:focus { */
/* border: 0px; */
/* outline: none; */
/* background-color:transparent; */
/* border-style:none; */
/* } */

#btn_del {
  position: absolute;
  top: 1px;
  left: 436px;
}

#btn_drop {
  position: absolute;
  top: 1px;
  left: 466px;
}

#btn_lookup {
  position: absolute;
  top: 0px;
  left: 486px;
}
</style>
