<template>
    <div>
        <el-form class="form-container" ref="audioForm" :model="audioForm" :rules="rules"
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
                <el-input v-model="audioForm.cover" placeholder="歌词直链"></el-input>
            </el-form-item>
            <el-form-item label="音频地址">
                <el-input v-model="audioForm.url" placeholder="音频直链"></el-input>
            </el-form-item>
            <el-form-item label="本体">
                <el-upload
                        ref="upload"
                        drag
                        :action="baseUrl+'/api/paper/upload_files'"
                        :data="audio_name"
                        :on-success="resetFile"
                        :on-error="resetForm"
                        multiple
                        :auto-upload="false"
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
                <el-button type="primary" @click="submitForm">添加</el-button>
                <el-button @click="resetForm">取消</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    export default {
        name: "AudioEditor",
        data() {
            return {
                audioForm: {
                    name: "", artist: "", url: "",
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
                        this.$axios.post(this.baseUrl + "/admin/audio?token=" + localStorage.getItem("token"), this.audioForm)
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
                                this.$message({showClose: true, message: '请检查你的土豆还在不在。' + err, type: 'error'});
                            });
                    } else {
                        return false;
                    }
                });
            },
            resetForm() {
                this.form = {
                    name: "", artist: "", url: "",
                    cover: "", lrc: "", others: "",
                };
                this.$refs.upload.clearFiles();
            },
            resetFile() {
                this.$message({
                    showClose: true,
                    message: '音频 ' + this.audioForm.name + ' 已就绪。',
                    type: 'success'
                });
                this.resetForm();
                setTimeout(() => {
                    this.$store.commit("setActiveAdminMenu", "audio-list")
                }, 1000)
            },
        },
        computed: {
            baseUrl() {
                return this.$store.state.baseUrl
            },
            audio_name() {
                return {
                    name: this.audioForm.name
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .form-container {
        max-width: $mobile-width;
        padding: 1rem 0 0 4rem;
    }

</style>