<template>
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
                    <el-tag v-if="scope.row.audio !== ''" style="margin-right: 10px" size="medium">
                        <a :href="getDownloadURL(scope.row.id, 'audio', scope.row.audio)" target="_blank">Audio</a>
                    </el-tag>
                    <el-tag v-if="scope.row.cover !== ''" style="margin-right: 10px" size="medium">
                        <a :href="getDownloadURL(scope.row.id, 'cover', scope.row.cover)" target="_blank">Cover</a>
                    </el-tag>
                    <el-tag v-if="scope.row.lrc !== ''" size="medium">
                        <a :href="getDownloadURL(scope.row.id, 'lrc', scope.row.lrc)" target="_blank">Lyric</a>
                    </el-tag>
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
</template>

<script>
    export default {
        name: "AudioList",
        data() {
            return {
                formLoading: true,
                tableData: null
            }
        },
        mounted() {
            this.$axios.get("/audio").then(res => {
                this.tableData = res.data.data;
                this.formLoading = false
            })
        },
        computed: {
            baseURL() {
                return this.$axios.defaults.baseURL
            }
        },
        methods: {
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