<template>
    <div class="playlist-form-container">
        <el-form :inline="true" ref="formBatch" class="playlist-form-container">
            <div class="playlist-form-tips">
                <i class="el-icon-question"></i>
                新增，修改和删除已有磁带。
            </div>
            <el-form-item label="新增磁带">
                <el-input v-model="plName" placeholder="名字"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit" :disabled="plName === ''">我好了</el-button>
            </el-form-item>
        </el-form>

        <el-card class="playlist" shadow="always" v-for="item in this.playlistData" :key="item.id">
            <el-popover
                    placement="bottom"
                    title="年代"
                    width="160"
                    trigger="hover">
                <span>{{ item.create }}</span>
                <span class="playlist-name" slot="reference">{{ item.name }}</span>
            </el-popover>

            <div style="float: right">
                <el-popover
                        placement="bottom"
                        width="200">
                    <el-input class="input-new-playlist" type="text" placeholder="新名字"
                              v-model="updatePlName"></el-input>
                    <div style="text-align: right; margin: 0">
                        <el-button size="mini" type="text" @click="resetPopover">打扰了
                        </el-button>
                        <el-button type="primary" size="mini" :disabled="updatePlName === ''"
                                   @click="updatePlaylist(item.id)">我好了
                        </el-button>
                    </div>
                    <i slot="reference" class="el-icon-edit-outline" style="cursor: pointer; padding-right: 5px"></i>
                </el-popover>

                <el-popconfirm
                        confirmButtonText='好的'
                        @onConfirm="deletePlaylist(item.id)"
                        cancelButtonText='不用了'
                        icon="el-icon-info"
                        iconColor="red"
                        title="此操作将会删除歌单内全部歌曲。"
                >
                    <i class="el-icon-delete" style="cursor: pointer" slot="reference"></i>
                </el-popconfirm>

            </div>
        </el-card>
    </div>

</template>

<script>
    export default {
        name: "Playlist",
        data() {
            return {
                plName: "",
                isUpdate: false,
                updatePlName: "",
                playlistData: [],
            }
        },
        methods: {
            updatePlaylist(id) {
                this.$axios.post("/playlist?token=" + this.getToken + "&id=" + id + "&name=" + this.updatePlName)
                    .then(res => {
                        if (res.data.code === 1) {
                            this.$message({message: '我也好了。', type: 'success'});
                            this.getPlaylist()
                        }
                    }).catch(err => {
                    this.$message({message: '但是我没好。' + err, type: 'error'});
                });
                this.resetPopover()
            },
            resetPopover() {
                document.querySelector("#app").click();
                this.updatePlName = "";
            },
            deletePlaylist(id) {
                this.$axios.delete("/playlist/" + id + "?token=" + this.getToken)
                    .then(res => {
                        if (res.data.code === 1) {
                            this.$message({message: '再见了您嘞。', type: 'success'});
                            this.getPlaylist()
                        }
                    }).catch(err => {
                    this.$message({message: '发生异常，请刷新你的土豆。' + err, type: 'error'});
                });
                this.resetPopover()
            },
            onSubmit() {
                this.$axios.post("/playlist?token=" + this.getToken + "&name=" + this.plName).then(res => {
                    if (res.data.code === 1) {
                        this.$message({message: 'Me too.', type: 'success'});
                        this.plName = "";
                        this.getPlaylist();
                    }
                }).catch(err => {
                    this.$message({message: '发生异常，请刷新你的土豆。' + err, type: 'error'});
                });
            },
            getPlaylist() {
                this.$axios.get("/playlist").then(res => {
                    if (res.data.code === 1 && res.data.data) {
                        this.playlistData = res.data.data;
                    }
                });
            }
        },
        created() {
            this.getPlaylist()
        },
        computed: {
            getToken() {
                return localStorage.getItem("token")
            }
        }
    }
</script>

<style lang="scss" scoped>
    .playlist-form-container {
        max-width: $mobile-width;
        padding-top: 1rem;
        margin: 0 auto;
    }

    .playlist-form-tips {
        padding-bottom: 2rem;
        /*font-size: 14px;*/
        color: #606266;
    }

    .playlist {
        display: inline-block;
        min-width: 150px;
        margin-right: 20px;
        margin-bottom: 15px;
    }

    .playlist-name {
        margin-right: 10px;
    }

    .input-new-playlist {
        padding-bottom: 10px;
    }
</style>