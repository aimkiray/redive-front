<template>
    <el-form :inline="true" :model="formBatch" ref="formBatch" class="batch-form-container">
        <div class="batch-form-tips">
            <i class="el-icon-question"></i>
            从云音乐导入歌单。打开云音乐网页版，进入歌单页面，从地址栏获取歌单ID。
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
            <el-button type="primary" @click="onSubmit" :disabled="batchStatus.total !== '0'">导入</el-button>
        </el-form-item>
        <div class="batch-form-status" v-if="batchStatus && batchStatus.total !== '0'">
            Process: {{ batchStatus.count }}/{{ batchStatus.total }}
            <br/>
            Current: {{ batchStatus.current }}
        </div>
        <div class="batch-form-status" v-if="errorData">
            <p v-for="err in errorData" v-bind:key="err.id">
                {{ err.id }}, {{ err.name }}, {{ err.type }}
            </p>
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
                    br: "999000",
                },
                batchStatus: {
                    count: "0",
                    total: "0",
                    current: "",
                    status: "",
                },
                errorData: {},
                timer: "",
                isImporting: 0,
            }
        },
        methods: {
            onSubmit() {
                this.errorData = {};
                this.$refs["formBatch"].validate((valid) => {
                    if (valid) {
                        // 定时查询进度
                        this.timer = setInterval(this.getBatchStatus, 1000);
                        // 开始批量导入
                        this.$axios.get("/batch?token=" + this.getToken, {
                            params: this.formBatch,
                            timeout: 0
                            // eslint-disable-next-line no-unused-vars
                        }).then(data => {
                            if (data.data.code === 0) {
                                // 清除定时查询任务
                                clearInterval(this.timer);
                                this.timer = "";
                            }
                        });
                        this.$message({
                            showClose: true,
                            message: "处理中。如果没有进度提示，请检查你的土豆。",
                            type: "info"
                        })
                    } else {
                        return false;
                    }
                });
            },
            getBatchStatus() {
                this.$axios.get("/batch/status").then(res => {
                    this.batchStatus = res.data.data;
                    if (this.batchStatus.status === "1") {
                        // 清除定时查询任务
                        clearInterval(this.timer);
                        this.timer = "";
                        // 错误消息
                        this.errorData = res.data.error;
                        this.$message({
                            showClose: true,
                            message: "导入完成，如果有歌曲导入失败，会在下方列出。",
                            type: "success"
                        });
                    }
                })
            },
            getToken() {
                return localStorage.getItem("token")
            },
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
        padding-bottom: 2rem;
        /*font-size: 14px;*/
        color: #606266;
    }

</style>