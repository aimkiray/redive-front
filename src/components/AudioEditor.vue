<template>
    <div>

        <el-form class="audio-form-container" ref="audioForm" :model="audioForm" :rules="audioRules"
                 label-position="right" label-width="40px">
            <div class="audio-form-tips">
                <i class="el-icon-question"></i>
                上传本地音频到服务器。只有名字是必填参数，其他随意，但最好同时上传MP3格式音频文件（毕竟我只是个没有感情的复读机。
            </div>
            <el-form-item label="歌单" prop="playlist">
                <el-select v-model="audioForm.playlist" placeholder="请选择歌单">
                    <el-option label="区域一" value="shanghai"></el-option>
                </el-select>
                <el-button @click.prevent="removeDomain(domain)">New</el-button>
            </el-form-item>
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
                        :data="fileForm"
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

        <el-dialog title="新增歌单" :visible.sync="dialogFormVisible">
            <el-form :model="plForm" class="login-container">
                <el-form-item label="名字">
                    <el-input v-model="plForm.name"></el-input>
                </el-form-item>
                <el-form-item label="简介">
                    <el-input v-model="plForm.desc" ></el-input>
                </el-form-item>
                <div>test</div>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="dialogFormVisible = false">确 定</el-button>
            </div>
        </el-dialog>

    </div>
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
                    playlist: "",
                    name: "",
                    artist: "",
                    audio: "",
                    cover: "",
                    lrc: "",
                    tlrc: "",
                    from: "upload",
                    others: "",
                },
                fileForm: {
                    id: "", name: "",
                },
                plForm: {
                    name: "", desc: ""
                },
                audioRules: {
                    name: [
                        {validator: validateName, trigger: 'blur'}
                    ]
                },
                dialogFormVisible: false,
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
                                    this.fileForm.id = res.data.id;
                                    this.fileForm.name = this.audioForm.name;
                                    this.$refs.upload.submit()
                                } else {
                                    this.$message({
                                        showClose: true,
                                        message: '载入失败，请检查你的土豆。',
                                        type: 'error'
                                    });
                                }
                            })
                            .catch(err => {
                                this.resetForm();
                                this.$message({
                                    showClose: true,
                                    message: '你的土豆被吃了。' + err,
                                    type: 'error'
                                });
                            });
                    } else {
                        return false;
                    }
                });
            },
            resetForm() {
                this.audioForm = {
                    playlist: "",
                    name: "",
                    artist: "",
                    audio: "",
                    cover: "",
                    lrc: "",
                    tlrc: "",
                    from: "upload",
                    others: "",
                };
                this.fileForm = {
                    id: "", name: "",
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
        padding-bottom: 2rem;
        /*font-size: 14px;*/
        color: #606266;
    }

</style>