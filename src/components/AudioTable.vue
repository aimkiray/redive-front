<template>
    <div>
        <span style="padding: 0 10px 0 10px">歌单</span>
        <el-select v-model="playlistID" @change="getPlaylist" placeholder="请选择歌单">
            <el-option
                    v-for="item in this.playlistData"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id">
            </el-option>
        </el-select>

        <el-table
                :data="tableData"
                v-loading="formLoading"
                element-loading-text="请稍等，毕竟我只是一个土豆"
                element-loading-spinner="el-icon-loading"
                element-loading-background="white"
                style="width: 100%">
            <el-table-column
                    label="日期">
                <template slot-scope="scope">
                    <i class="el-icon-time"></i>
                    <span style="margin-left: 10px">{{ scope.row.create }}</span>
                </template>
            </el-table-column>
            <el-table-column
                    label="名字">
                <template slot-scope="scope">
                    <span>{{ scope.row.name }}</span>
                </template>
            </el-table-column>
            <el-table-column
                    label="作者">
                <template slot-scope="scope">
                    <span>{{ scope.row.artist }}</span>
                </template>
            </el-table-column>
            <el-table-column
                    label="素材">
                <template slot-scope="scope">
                    <div slot="reference" class="name-wrapper">
                        <a style="margin-right: 5px" v-if="scope.row.audio !== ''"
                           :href="getDownloadURL(scope.row.id, 'audio', scope.row.audio)"
                           target="_blank">Audio</a>
                        <a style="margin-right: 5px" v-if="scope.row.cover !== ''"
                           :href="getDownloadURL(scope.row.id, 'cover', scope.row.cover)"
                           target="_blank">Cover</a>
                        <a style="margin-right: 5px" v-if="scope.row.lrc !== ''"
                           :href="getDownloadURL(scope.row.id, 'lrc', scope.row.lrc)"
                           target="_blank">Lyric</a>
                        <a v-if="scope.row.tlrc !== ''" :href="getDownloadURL(scope.row.id, 'tlrc', scope.row.tlrc)"
                           target="_blank">tLyric</a>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button
                            size="mini"
                            type="danger"
                            @click="handleDelete(scope.$index, scope.row)">删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
    export default {
        name: "AudioList",
        data() {
            return {
                formLoading: true,
                playlistData: [],
                tableData: [],
                playlistID: "",
            }
        },
        mounted() {
            this.$axios.get("/playlist").then(res => {
                if (res.data.code === 1 && res.data.data) {
                    this.playlistData = res.data.data;
                    this.playlistID = this.playlistData[0].id;
                }
            });

            // 默认查询第一个歌单
            this.$axios.get("/audio").then(res => {
                this.tableData = res.data.data;
                // this.playlistID = res.data.id;
                this.formLoading = false
            })
        },
        computed: {
            baseURL() {
                return this.$axios.defaults.baseURL
            }
        },
        methods: {
            getPlaylist() {
                this.$axios.get("/audio?id=" + this.playlistID).then(res => {
                    this.tableData = res.data.data;
                    this.formLoading = false
                })
            },
            handleDelete(index, row) {
                this.$axios.delete("/audio/" + row.id + "?token=" + localStorage.getItem("token"))
                    .then(res => {
                        if (res.data.code === 1) {
                            this.$message({message: '删除成功', type: 'success'});
                            this.tableData.splice(index, 1)
                        }
                    }).catch(err => {
                    this.$message({message: "非法操作。" + err, type: 'error'});
                })
            },
            getDownloadURL(id, type, path) {
                if (path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type
                    } else {
                        return path
                    }
                }
                return "nothing"
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>