<template>
  <button
    id="$attrs.id"
    type="button"
    class="imgButton4"
    :style="{ backgroundImage: 'url(' + $props.img + ')' }"
    @click="btnClicked"
    @mouseover="mouseenter"
    @mouseleave="mouseleave"
    @mousedown="mousedown"
    @mouseup="mouseup"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  img: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

const mouseenter = (evt: Event) => {
  const id = (evt.target as HTMLInputElement)?.id;
  const btn = document.getElementById(id);
  if (btn) {
    const x = `${-1 * props.width}px`;
    // console.log(id + "mouseenter " + x);
    btn.style.backgroundPositionX = x;
  }
};

const mouseleave = (evt: Event) => {
  const id = (evt.target as HTMLInputElement)?.id;
  const btn = document.getElementById(id);
  if (btn) {
    btn.style.backgroundPositionX = "0px";
  }
};

const mousedown = (evt: Event) => {
  const id = (evt.target as HTMLInputElement)?.id;
  const btn = document.getElementById(id);
  if (btn) {
    btn.style.backgroundPositionX = `${-2 * props.width}px`;
  }
};

const mouseup = (evt: Event) => {
  const id = (evt.target as HTMLInputElement)?.id;
  const btn = document.getElementById(id);
  if (btn) {
    btn.style.backgroundPositionX = `${-1 * props.width}px`;
  }
};

const emit = defineEmits(["btnCliked"]);
const btnClicked = (evt: Event) => {
  emit("btnCliked", (evt.target as HTMLInputElement)?.id);
};
</script>

<style scoped>
.imgButton4 {
  /* background-image: v-bind(img); */
  /* background-image: url('./skin/prev_btn.bmp'); */
  /* --width: calc(v-bind(width) * 1px); */
  /* width: var(--width); */
  width: calc(v-bind(width) * 1px);
  height: calc(v-bind(height) * 1px);
  background-position: 0px 0px;
  outline: "none";
  border: none;
}

/* button:hover{
    // background-position-x: calc(var(--width) * (-1));
    background-position-x: calc(v-bind(width) * (-1px));
} */

button[type="button"]:disabled {
  /* background-position-x: calc(var(--width) * (-3)); */
  background-position-x: calc(v-bind(width) * (-3px));
}

button[type="button"]:enabled {
  background-position-x: 0px;
}
</style>
