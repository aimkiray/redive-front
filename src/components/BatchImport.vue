<template>
    <el-form :inline="true" :model="formBatch" ref="formBatch" class="batch-form-container">
        <div class="batch-form-tips">
            <i class="el-icon-question"></i>
            从网易云导入歌单。打开网易云音乐网页版，进入歌单页面，从地址栏获取歌单ID。
        </div>
        <el-form-item label="歌单ID">
            <el-input v-model="formBatch.id" placeholder="ID"></el-input>
        </el-form-item>
        <el-form-item label="比特率">
            <el-select v-model="formBatch.br" placeholder="Bit rate">
                <el-option label="赛高" value="999000"></el-option>
                <el-option label="320K" value="320000"></el-option>
                <el-option label="192K" value="192000"></el-option>
                <el-option label="128K" value="128000"></el-option>
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit" :disabled="batch.total !== '0'">导入</el-button>
        </el-form-item>
        <div class="batch-form-status" v-show="batch.total !== '0'">Process: {{ batch.count }}/{{ batch.total }}
            <br/>Current: {{ batch.current }}
        </div>
    </el-form>

</template>

<script>
    export default {
        name: "BatchImport",
        data() {
            return {
                formBatch: {
                    id: "",
                    br: "999000"
                },
                batch: {
                    count: "0",
                    total: "0",
                    current: ""
                },
                timer: "",
            }
        },
        methods: {
            onSubmit() {
                this.$refs["formBatch"].validate((valid) => {
                    if (valid) {
                        this.$axios.get("/batch", {
                            params: this.formBatch
                        }).then(res => {
                            if (res.data.code === 1) {
                                this.$message({
                                    showClose: true,
                                    message: "导入完成",
                                    type: "success"
                                });
                            } else {
                                this.$message({
                                    showClose: true,
                                    message: "导入失败，请重试。" + res.data.message,
                                    type: "error"
                                })
                            }
                        }).catch(error => {
                            this.$message({
                                showClose: true,
                                message: "你的土豆去世了。" + error,
                                type: "error"
                            })
                        })
                    } else {
                        return false;
                    }
                });
            },
            batchStatus() {
                this.$axios.get("/batch/status").then(res => {
                    this.batch = res.data.data
                })
            }
        },
        mounted() {
            this.timer = setInterval(this.batchStatus, 1000);
        },
        beforeDestroy() {
            clearInterval(this.timer);
        }
    }
</script>

<style lang="scss" scoped>
    .batch-form-container {
        max-width: $mobile-width;
        padding-top: 1rem;
        margin: 0 auto;
    }

    .batch-form-tips {
        padding-bottom: 1rem;
        font-size: 14px;
        color: #606266;
    }

</style>