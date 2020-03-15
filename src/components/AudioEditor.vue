<template>

    <el-form class="audio-form-container" ref="audioForm" :model="audioForm" :rules="rules"
             label-position="right" label-width="40px">
        <div class="audio-form-tips">
            <i class="el-icon-question"></i>
            上传本地音频到服务器。只有名字是必填参数，其他随意，但最好同时上传MP3格式音频文件（毕竟我只是个没有感情的复读机。
        </div>
        <el-form-item label="名字" prop="name">
            <el-input v-model="audioForm.name" placeholder="展示名称"></el-input>
        </el-form-item>
        <el-form-item label="作者">
            <el-input v-model="audioForm.artist" placeholder="音频作者"></el-input>
        </el-form-item>
        <el-form-item label="封面">
            <el-input v-model="audioForm.cover" placeholder="封面直链" disabled></el-input>
        </el-form-item>
        <el-form-item label="歌词">
            <el-input v-model="audioForm.lrc" placeholder="歌词直链" disabled></el-input>
        </el-form-item>
        <el-form-item label="音频">
            <el-input v-model="audioForm.audio" placeholder="音频直链" disabled></el-input>
        </el-form-item>
        <el-form-item label="本体">
            <el-upload
                    ref="upload"
                    drag
                    :action="baseURL + '/audio/upload?token=' + getToken"
                    :data="audioName"
                    :on-success="resetFile"
                    :on-error="resetForm"
                    :auto-upload="false"
                    multiple
            >
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖过来，或<em>点咱上传</em></div>
            </el-upload>
            <el-alert
                    title="只能上传mp3/lrc/jpg/png文件，封面&歌词&本体可以一起上传。如果同时存在直链，则直链将被覆盖。"
                    type="warning">
            </el-alert>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm('audioForm')">添加</el-button>
            <el-button @click="resetForm">取消</el-button>
        </el-form-item>
    </el-form>

</template>

<script>
    export default {
        name: "AudioEditor",
        data() {
            const validateName = (rule, value, callback) => {
                if (value === '') {
                    callback(new Error('请输入音频名称。'));
                } else {
                    callback();
                }
            };
            return {
                audioForm: {
                    name: "", artist: "", audio: "", cover: "", lrc: "", tlrc: "", from: "upload", others: "",
                },
                rules: {
                    name: [
                        {validator: validateName, trigger: 'blur'}
                    ]
                }
            }
        },
        methods: {
            submitForm(formName) {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        // Upload audio information first
                        this.$axios.post("/audio?token=" + this.getToken, this.audioForm)
                            .then(res => {
                                if (res.data.code === 1) {
                                    this.$message({
                                        showClose: true,
                                        message: '音频 ' + this.audioForm.name + ' 准备就绪...',
                                        type: 'info'
                                    });
                                    // Then upload the audio file
                                    this.$refs.upload.submit()
                                } else {
                                    this.$message({showClose: true, message: '载入失败，请检查你的土豆状态', type: 'error'});
                                }
                            })
                            .catch(err => {
                                this.resetForm();
                                this.$message({showClose: true, message: '你的土豆被吃了。' + err, type: 'error'});
                            });
                    } else {
                        return false;
                    }
                });
            },
            resetForm() {
                this.form = {
                    name: "", artist: "", audio: "", cover: "", lrc: "", tlrc: "", from: "upload", others: "",
                };
                this.$refs.upload.clearFiles();
                // TODO delete file
            },
            resetFile() {
                this.$message({
                    showClose: true,
                    message: '音频 ' + this.audioForm.name + ' 已就绪。',
                    type: 'success'
                });
                this.resetForm();
                setTimeout(() => {
                    this.$router.push({name: "audio-table"})
                }, 10000)
            },
        },
        computed: {
            audioName() {
                return {
                    name: this.audioForm.name
                }
            },
            baseURL() {
                return this.$axios.defaults.baseURL
            },
            getToken() {
                return localStorage.getItem("token")
            },
        }
    }
</script>

<style lang="scss" scoped>
    .audio-form-container {
        max-width: $mobile-width;
        padding-top: 1rem;
        margin: 0 auto;
    }

    .audio-form-tips {
        padding-bottom: 1rem;
        font-size: 14px;
        color: #606266;
    }

</style>