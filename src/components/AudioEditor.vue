<template>

    <el-form class="audio-form-container" label-position="right" ref="audioForm" :model="audioForm" :rules="rules"
             label-width="80px">
        <el-form-item label="名称" prop="name">
            <el-input v-model="audioForm.name" placeholder="展示名称"></el-input>
        </el-form-item>
        <el-form-item label="作者">
            <el-input v-model="audioForm.artist" placeholder="音频作者"></el-input>
        </el-form-item>
        <el-form-item label="封面地址">
            <el-input v-model="audioForm.cover" placeholder="封面直链"></el-input>
        </el-form-item>
        <el-form-item label="歌词地址">
            <el-input v-model="audioForm.lrc" placeholder="歌词直链"></el-input>
        </el-form-item>
        <el-form-item label="音频地址">
            <el-input v-model="audioForm.audio" placeholder="音频直链"></el-input>
        </el-form-item>
        <el-form-item label="本体">
            <el-upload
                    ref="upload"
                    drag
                    :action="baseUrl + '/audio/upload?token=' + getToken"
                    :data="audioName"
                    :on-success="resetFile"
                    :on-error="resetForm"
                    :auto-upload="false"
                    multiple
            >
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
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
            return {
                audioForm: {
                    name: "", artist: "", audio: "",
                    cover: "", lrc: "", others: "",
                },
                rules: {
                    name: [
                        {required: true, message: '请输入音频名称', trigger: 'blur'}
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
                                    });// Then upload the audio file
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
                    name: "", artist: "", audio: "",
                    cover: "", lrc: "", others: "",
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
                    // this.$store.commit("setActiveAdminMenu", "audio-list");
                    this.$router.push({name: "audio-list"})
                }, 1000)
            },
        },
        computed: {
            audioName() {
                return {
                    name: this.audioForm.name
                }
            },
            baseUrl() {
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

</style>