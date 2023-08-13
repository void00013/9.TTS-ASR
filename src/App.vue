<template>
  <div class="app">
    <div class="get_token">
      <h1>1.请输入你的client_id和client_secret获取access_token</h1>
      <el-row :gutter="50">
        <el-col :span="8">
          <el-input v-model.trim="client_id" placeholder="请输入你的client_id(应用的API Key)" />
        </el-col>
        <el-col :span="8">
          <el-input v-model.trim="client_secret" placeholder="请输入你的client_secret(应用的Secret Key)" />
        </el-col>
        <el-col :span="8"><el-button @click="handleGetAccessToken">获取AccessToken</el-button></el-col>
      </el-row>
    </div>

    <hr>

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
          <el-input v-model.trim="inputText" placeholder="请输入你要转化的文本" />
        </el-col>
        <el-col :span="2"><el-button @click="handleTextToAudio">语音合成</el-button></el-col>
        <el-col :span="8">
          <audio :src="audioSrc" v-if="audioSrc" controls>
            您的浏览器不支持音频播放。
          </audio>
        </el-col>
      </el-row>
    </div>

  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import qs from "qs";
import { ElMessage } from "element-plus";

// client_id是你创建的应用的API Key
const client_id = ref("");
// client_secret是你创建应用的Secret Key
const client_secret = ref("");
// 配音角色
const per = ref("1");
const inputText = ref("");
const audioSrc = ref("");

// 提示
const openMsg = (message, type) => {
  ElMessage({
    message,
    type,
  });
};

// 1.获取AccessToken
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
</script>

<style scoped>
.app {
  width: 80%;
  height: 100%;
  margin: auto;
}

:deep(.el-radio-group) {
  margin-bottom: 30px;
}
</style>
