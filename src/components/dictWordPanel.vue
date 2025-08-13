<template>
  <div class="word_panel">
    <!-- <div id="queryword" style="display: none;">such</div> -->
    <div class="text">
      {{ props.word }}
    </div>
    <div id="Player" class="sound">
      <button id="playpause" ref="btnPlayPauseRef" class="jp-play" @click="ClickAudio" />
      <audio id="wordAudio" ref="audioWordRef" autoplay @play="onPlay" @ended="onEnded">
        <source :src="props.audioURL" type="audio/mpeg" />
        Your browser does not support the audio tag.
      </audio>
    </div>
    <div class="newMmark">NEW</div>
    <div class="level">
      {{ props.level }}
    </div>
    <ul class="stars">
      <li>★</li>
      <li>★</li>
      <li>★</li>
      <li>★</li>
      <li>★</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  word: string;
  audioURL: string;
  bNew: boolean;
  level: string;
  nStars: number;
}>();

const btnPlayPauseRef = ref<HTMLButtonElement>();
const audioWordRef = ref<HTMLAudioElement>();

/* function updatePlayBtnSt(playing: boolean) {
  const btnPlayPause = btnPlayPauseRef.value;
  if (playing) {
    btnPlayPause?.classList.add('jp-state-playing');
  } else {
    btnPlayPause?.classList.remove('jp-state-playing');
  }
}
const audioElemnt = audioWordRef.value;
audioElemnt?.addEventListener("play", (event) => {
  // var btn = event?.currentTarget?.previousSibling?.previousSibling as HTMLButtonElement;
  // console.log(btnPlayPause);
  console.log(event);
  updatePlayBtnSt(true);
});
audioElemnt?.addEventListener("playing", (event) => {
  // var btn = event?.currentTarget as HTMLButtonElement;
  // var btn = event?.currentTarget?.previousSibling?.previousSibling as HTMLButtonElement;
  // console.log(btn);
  console.log(event);
  updatePlayBtnSt(true);
});
audioElemnt?.addEventListener("ended", (event) => {
  // var btn = event?.currentTarget as HTMLButtonElement;
  // var btn = event?.currentTarget?.previousSibling?.previousSibling as HTMLButtonElement;
  // console.log(btn);
  console.log(event);
  updatePlayBtnSt(false);
}); */

const onPlay = () => {
  const btnPlayPause = btnPlayPauseRef.value;
  btnPlayPause?.classList.add('jp-state-playing');
}

const onEnded = () => {
  const btnPlayPause = btnPlayPauseRef.value;
  btnPlayPause?.classList.remove('jp-state-playing');
}

const Play = () => {
  const audioElemnt = audioWordRef.value;
  console.log("Play: ", audioElemnt);
  if (audioElemnt) {
    /* if (audioElemnt.paused || audioElemnt.ended) {
      audioElemnt.play();
      console.log("word: allow to play!");
      // updatePlayBtnSt(false);
    } else {
      audioElemnt.pause();
      console.log("word: not allow to play!");
      // updatePlayBtnSt(true);
    } */
    audioElemnt.pause();
    audioElemnt.currentTime = 0;
    // audioElemnt.src = props.audioURL;
    audioElemnt.load();
    audioElemnt.play().catch(error => {
      console.error("Error to play: ", error);
      console.error("url: ", props.audioURL);
      console.error("src: ", audioElemnt.src);
    })
  }
};

const ClickAudio = () => {
  Play();
};

defineExpose({
  Play,
});
</script>

<style scoped>
.word_panel {
  position: absolute;
  left: 0px;
  top: 83px;
  width: 701px;
  /* width: 100%; */
  height: 60px;
  margin: auto;
  box-sizing: border-box;
  overflow: hidden;
}

.text {
  color: #0000ff;
  /*text-transform:capitalize;*/
  margin: 10px auto 20px 0px;
  font-size: 25pt;
  font-weight: bold;
}

.phonetic {
  /* margin:0px 0px 20px 10px; */
  margin: 0px 0px 0px 5px;
  /*margin-top:-25px;*/
  vertical-align: middle;
  /*display: inline-block;
    display: inline;*/
}

.sound button {
  /* display:inline-block; */
  /* display: inline; */
  /* float:left; */
  /* overflow:hidden; */
  /* text-indent:-9999px; */
  border: none;
  cursor: pointer;
}

.jp-play {
  width: 40px;
  height: 40px;
  background: url(./assets/images/jplayer.blue.monday.png) no-repeat;
}

.jp-play:focus {
  background: url(./assets/images/jplayer.blue.monday.png) -41px 0 no-repeat;
}

.jp-state-playing.jp-play {
  background: url(./assets/images/jplayer.blue.monday.png) 0 -42px no-repeat;
}

.jp-state-playing.jp-play:focus {
  background: url(./assets/images/jplayer.blue.monday.png) -41px -42px no-repeat;
}

.text,
.sound,
.phonetic {
  display: inline-block;
  display: inline;
}

.newMmark {
  color: Gainsboro;
  margin: 0px 0px 0px 5px;
  vertical-align: middle;
  font-size: 15pt;
  font-weight: normal;
  display: inline-block;
  display: inline;
}

.level {
  color: #ff0080;
  position: absolute;
  top: 10px;
  right: 150px;
  font-size: 15pt;
  font-weight: bold;
}

.stars {
  white-space: nowrap;
  text-align: right;
  margin-right: 10px;
  margin-top: 10px;
  margin-bottom: 0px;
  float: right;
}

.stars li {
  display: inline-block;
  color: #adadad;
  font-size: 20px;
}
</style>
