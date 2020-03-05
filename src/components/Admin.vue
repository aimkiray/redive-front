<template>
    <el-col :span="12">
        <el-menu
                default-active="2"
                class="el-menu-vertical-demo"
                @open="handleOpen"
                @close="handleClose">
            <el-menu-item index="voice-list">
                <i class="el-icon-document"></i>
                <span slot="title">复读列表</span>
            </el-menu-item>
            <el-menu-item index="add-voice">
                <i class="el-icon-document-add"></i>
                <span slot="title">新增复读</span>
            </el-menu-item>
        </el-menu>
        <div>

        </div>
    </el-col>
    
</template>

<script>
    export default {
        name: "Admin"
    }
</script>

<style scoped>

</style>