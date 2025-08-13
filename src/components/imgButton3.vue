<template>
  <button
    id="$attrs.id"
    ref="btnRef"
    type="button"
    @click="btnClicked"
    @mouseover="mouseenter"
    @mouseleave="mouseleave"
    @mousedown="mousedown"
    @mouseup="mouseup"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

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

// const id = ref<String>("btn_max");
const btnRef = ref<any>(null);

onMounted(() => {
  // const btn = document.getElementsByClassName("ThreeStateButton");
  // const btn = document.getElementById(id.value);
  if (btnRef.value) {
    const btnStyle = `border: none;
                background-image: url('${props.img}');
                width: ${props.width}px;
                height: ${props.height}px;
                background-position: 0px 0px;
                outline: 'none';`;
    btnRef.value.style.cssText = btnStyle;
    // console.log(btnStyle);
  }
  return { btnRef };
});

const emit = defineEmits(["btnCliked"]);
const btnClicked = (evt: Event) => {
  emit("btnCliked", (evt.target as HTMLInputElement)?.id);
};

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
</script>

<style lang="less" scoped></style>
