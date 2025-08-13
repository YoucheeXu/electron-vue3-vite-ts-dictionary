<template>
  <div class="bottom_panel">
    <label id="status" style="height: 20px; margin: 5px 0px 0px 5px" />
    <input id="chk_TOPMOST" type="checkbox" name="TopMost" value="TopMost" @click="TopMostOrNot" />
    <p id="txt_TOPMOST">Always TOP</p>
  </div>
</template>

<script setup lang="ts">
const TopMostOrNot = () => {
  console.log("Top Most or Not");
};
</script>

<style scoped>
.bottom_panel {
  position: absolute;
  left: 0px;
  top: 513px;
  height: 35px;
  width: 701px;
  margin: auto;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #43a0ff;
}

#chk_TOPMOST {
  position: absolute;
  left: 585px;
  bottom: 10px;
}

#txt_TOPMOST {
  position: absolute;
  left: 605px;
  bottom: -10px;
}
</style>
