<template>
  <div class="app">
    <div class="get_tts_token">
      <h1>
        1.请输入你<i>语音合成</i>应用的client_id和client_secret获取access_token
      </h1>
      <el-row :gutter="50">
        <el-col :span="8">
          <el-input
            v-model.trim="client_id"
            placeholder="请输入你的client_id(应用的API Key)"
          />
        </el-col>
        <el-col :span="8">
          <el-input
            v-model.trim="client_secret"
            placeholder="请输入你的client_secret(应用的Secret Key)"
          />
        </el-col>
        <el-col :span="8"
          ><el-button @click="handleGetAccessToken"
            >获取AccessToken</el-button
          ></el-col
        >
      </el-row>
    </div>

    <hr />

    <div class="text2audio">
      <h1>2.语音合成</h1>
      <h4>免费的只能使用前4种语音</h4>
      <el-radio-group v-model="per">
        <el-radio-button label="1">度小宇</el-radio-button>
        <el-radio-button label="0">度小美</el-radio-button>
        <el-radio-button label="3">度逍遥（基础）</el-radio-button>
        <el-radio-button label="4">度丫丫</el-radio-button>
        <el-radio-button label="5003">度逍遥（精品）</el-radio-button>
        <el-radio-button label="5118">度小鹿</el-radio-button>
        <el-radio-button label="106">度博文</el-radio-button>
        <el-radio-button label="110">度小童</el-radio-button>
        <el-radio-button label="111">度小萌</el-radio-button>
        <el-radio-button label="103">度米朵</el-radio-button>
        <el-radio-button label="5">度小娇</el-radio-button>
      </el-radio-group>
      <el-row :gutter="50">
        <el-col :span="8">
          <el-input
            v-model.trim="inputText"
            placeholder="请输入你要转化的文本"
          />
        </el-col>
        <el-col :span="2"
          ><el-button @click="handleTextToAudio">语音合成</el-button></el-col
        >
        <el-col :span="8">
          <audio :src="audioSrc" v-if="audioSrc" controls>
            您的浏览器不支持音频播放。
          </audio>
        </el-col>
      </el-row>
    </div>

    <hr />

    <div class="get_asr_token">
      <h1>
        3.请输入你<i>语音识别</i>应用的client_id和client_secret获取access_token
      </h1>
      <el-row :gutter="50">
        <el-col :span="8">
          <el-input
            v-model.trim="client_id"
            placeholder="请输入你的client_id(应用的API Key)"
          />
        </el-col>
        <el-col :span="8">
          <el-input
            v-model.trim="client_secret"
            placeholder="请输入你的client_secret(应用的Secret Key)"
          />
        </el-col>
        <el-col :span="8"
          ><el-button @click="handleGetAccessToken"
            >获取AccessToken</el-button
          ></el-col
        >
      </el-row>
    </div>

    <hr />

    <div class="audio2text">
      <h1>4.语音识别</h1>
      <el-row :gutter="50">
        <el-col :span="4">
          <el-button @click="handleGetPermissions">获取录音权限</el-button>
        </el-col>
        <el-col :span="4">
          <el-button @click="handleRecording">{{ recordBtn }}</el-button>
        </el-col>
        <el-col :span="8">
          <audio :src="audioRecordSrc" controls></audio>
        </el-col>
      </el-row>
      <el-row :gutter="50">
        <el-col :span="4">
          <el-button @click="handleSpeechRecognition">语音识别</el-button>
        </el-col>
        <el-col :span="8">
          {{ recordText }}
          <!-- <audio :src="audioRecordSrc" controls></audio> -->
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import axios from "axios";
import qs from "qs";
import { ElMessage, ElMessageBox } from "element-plus";
import { HZRecorder } from "./utils/recorder";

// 提示
const openMsg = (message, type) => {
  ElMessage({
    message,
    type,
  });
};

// 1.获取AccessToken
// client_id是你创建的应用的API Key，client_secret是你创建应用的Secret Key
const client_id = ref("");
const client_secret = ref("");

const handleGetAccessToken = async () => {
  try {
    const option = {
      grant_type: "client_credentials",
      client_id: client_id.value,
      client_secret: client_secret.value,
    };
    const res = await axios.post("/oauth/2.0/token", qs.stringify(option));
    if (res.status !== 200) {
      return openMsg(res.statusText, "warning");
    }
    openMsg("获取token成功", "success");
    localStorage.setItem("access_token", res.data.access_token);
    client_id.value = "";
    client_secret.value = "";
  } catch (error) {
    console.log(error);
  }
};

// 2.语音合成接口调用
// per配音角色
const per = ref("1");
// 输入的文本
const inputText = ref("");
// 动态绑定audio的src属性
const audioSrc = ref("");

const handleTextToAudio = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return openMsg("请先获取token！", "warning");
  }
  textToAudio(token);
};
const textToAudio = async (token) => {
  const option = {
    tex: inputText.value,
    tok: token,
    cuid: `${Math.floor(Math.random() * 1000000)}`,
    ctp: "1",
    lan: "zh",
    per: per.value,
  };
  const res = await axios.post("/text2audio", qs.stringify(option), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    responseType: "blob",
  });
  if (res.status !== 200) {
    return openMsg(res.statusText, "warning");
  }
  openMsg("语音合成成功", "success");
  audioSrc.value = URL.createObjectURL(res.data);
};

// 3.语音识别
let recordBtn = ref("开始录音");
// 存放录音器的实例
let mediaRecorder = null;
// 存储音频数据
let chunks = [];
let speech = "";
let fileSize = 0;
const audioRecordSrc = ref("");
const recordText = ref("");
//
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.URL = window.URL || window.webkitURL;
const audio_context = new AudioContext();
let recorder = null;
let isRecorder = false;
let wavBlob = null;

// 获取权限
const handleGetPermissions = () => {
  // constraints 为需要获取的权限列表，这里只需要指定音频 audio 即可。其返回是个 Promise，因为用户何时进行授权是不确定的。通过在 Promise 的回调中进行授权成功或失败的处理。在使用前需要判断浏览器是否已经支持相应的 API
  if (navigator.mediaDevices.getUserMedia) {
    const constraints = { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        // // 成功回调里得到的入参 stream 为 MediaStream 对象。
        // console.log("授权成功！");
        // // 创建一个录音器的实例
        // mediaRecorder = new MediaRecorder(stream);
        // // 当录音开始时，会触发其 MediaRecorder.ondataavailable 事件，从该事件回调的入参为 BlobEvent，从它身上取到 event.data 便是我们需要的音频数据。因为数据是一段一段产生的，所以需要暂存到一个数组中。
        // mediaRecorder.ondataavailable = function (e) {
        //   if (e.data.size > 0) {
        //     chunks.push(e.data);
        //   }
        // };
        // // 通过监听 MediaRecorder.onstop 事件，将收集好的音频数据创建成 Blob 对象
        // mediaRecorder.onstop = (e) => {
        //   // let blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        //   // let blob = new Blob(chunks, { type: "audio/pcm" });
        //   let blob = new Blob(chunks, { type: "audio/wav" });
        //   fileSize = blob.size;
        //   chunks = [];
        //   audioRecordSrc.value = window.URL.createObjectURL(blob);
        //   let reader = new FileReader();

        //   reader.onload = () => {
        //     const arrayBuffer = reader.result;
        //     // 将ArrayBuffer编码为Base64字符串，btoa编码出来的base64字符串没有前缀，如果需要前缀请使用readAsDataURL读取文件
        //     speech = btoa(
        //       new Uint8Array(arrayBuffer).reduce(
        //         (data, byte) => data + String.fromCharCode(byte),
        //         ""
        //       )
        //     );
        //     console.log(speech); // 在控制台中输出Base64编码字符串
        //   };
        //   // readAsArrayBuffer是把文件读取为缓存数组
        //   reader.readAsArrayBuffer(blob);

        //   // reader.onload = function () {
        //   //   // console.log(this.result, reader.result, e.target.result);
        //   //   console.log(this.result);
        //   // };
        //   // // 注意：readAsDataURL是把文件读取为base64字符串
        //   // reader.readAsDataURL(blob);
        // };

        recorder = new HZRecorder(stream);
        console.log("初始化完成");
      },
      () => {
        console.error("授权失败！");
      }
    );
  } else {
    console.error("浏览器不支持 getUserMedia");
  }
};
// 录音
// const handleRecording = () => {
//   // MediaRecorder 实例上有个 state 状态，可用来判断录音器当前的活动状态，总共有三种值：
//   // inactive：处于休息状态，要么是没开始，要么是开始后已经停止。
//   // recording：录音中
//   // paused：已经开始，但被暂停了，不是停止也没有被恢复。
//   // 所以通过这个状态，我们可以实现再次点击按钮时，结束录音。
//   if (mediaRecorder.state === "recording") {
//     mediaRecorder.stop();
//     recordBtn.value = "开始录音";
//     console.log("录音结束");
//   } else {
//     mediaRecorder.start();
//     recordBtn.value = "结束录音";
//     console.log("录音中...");
//   }
//   console.log("录音器状态：", mediaRecorder.state);
// };
const handleRecording = () => {
  if (!isRecorder) {
    recorder && recorder.start();
    recordBtn.value = "结束录音";
    isRecorder = true;
  } else {
    recorder && recorder.stop();
    wavBlob = recorder.upload();
    console.log(wavBlob);
    audioRecordSrc.value = window.URL.createObjectURL(wavBlob);
    recordBtn.value = "开始录音";
    isRecorder = false;
  }
};
// 语音识别
// const handleSpeechRecognition = async () => {
//   const token = localStorage.getItem("access_token");
//   if (!token) {
//     return openMsg("请先获取token！", "warning");
//   }
//   const option = {
//     format: "pcm",
//     rate: 16000,
//     channel: 1,
//     speech: speech,
//     cuid: "GjoE0usdnj83ETQY3rXaJXzt0nDuVuhQ",
//     token,
//     len: fileSize,
//   };
//   const res = await axios.post("/server_api", option, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
//   console.log(res);
//   if (res.data.err_no !== 0) {
//     return openMsg(res.data.err_msg, "warning");
//   }
//   openMsg("识别成功", "success");
//   recordText.value = res.data.result[0];
// };
const handleSpeechRecognition = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return openMsg("请先获取token！", "warning");
  }
  // wavBlob = recorder.upload();
  let blobToDataURL = (blob, callback) => {
    var a = new FileReader();
    a.onload = function (e) {
      callback(e.target.result.split("data:audio/wav;base64,")[1]);
    };
    a.readAsDataURL(blob);
  };
  blobToDataURL(wavBlob, async (base_64) => {
    const res = await axios.post(
      "/server_api",
      {
        speech: base_64, //本地语音文件的的二进制语音数据 ，需要进行base64 编码。与len参数连一起使用。
        len: wavBlob.size, //字节数
        dev_pid: 1537, //普通话识别代码
        cuid: "541b:3f:5af4:b2c9",
        rate: 16000, //音频格式16k或8k 采样率、16bit 位深、单声道，
        token: token, //根据你的参数获取的token
        channel: 1, //单声道
        format: "wav", //识别的格式
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    recorder.clear();
    if (res.data.err_no !== 0) {
      return openMsg(res.data.err_msg, "warning");
    }
    openMsg("识别成功", "success");
    recordText.value = res.data.result[0];
    console.log("识别结果：" + res.data.result[0]);
  });
};
</script>

<style scoped>
.app {
  width: 80%;
  margin: auto;
  margin-top: 50px;
}

hr {
  margin: 30px 0;
}

h1 {
  margin: 10px 0;
}

:deep(.el-radio-group) {
  margin-bottom: 30px;
}
</style>
