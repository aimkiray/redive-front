<template>
    <div id="app">
        <el-header>
            <el-menu
                    :default-active="activeMenu"
                    mode="horizontal"
                    @select="handleSelect">
                <el-menu-item index="voice-player">
                    <span slot="title">复读</span>
                </el-menu-item>
                <el-menu-item index="voice-editor" disabled>碟片</el-menu-item>
                <el-menu-item>
                    <a href="https://github.com/aimkiray/reosu" target="_blank">Github</a>
                </el-menu-item>
            </el-menu>
        </el-header>

        <router-view></router-view>
<!--        <VoicePlayer class="voice-player" v-bind:audio="audio"/>-->
    </div>
</template>

<script>
    export default {
        name: 'app',
        data() {
            return {

            };
        },
        methods: {
            handleSelect(key, keyPath) {
                // eslint-disable-next-line no-console
                console.log(key, keyPath);
                this.$router.push({
                    name: key
                })
            }
        },
        computed:{
            baseUrl(){
                return this.$store.state.baseUrl
            },
            activeMenu: {
                get(){
                    return this.$store.state.activeMenu;
                },
                set(value){
                    this.$store.commit("setActiveMenu", value);
                }
            }
        },
    }
</script>

<style lang="scss">
    @import "./styles/index";

    .el-header {
        padding: 0;
        margin: 0;
    }

    .el-menu--horizontal {
        background-color: $accent-color;

        .el-menu-item {
            color: $white-text-color;

            &.is-active {
                color: $light-text-color;
                border-bottom: 2px solid $light-text-color;
            }

            &:not(.is-disabled) {
                &:hover {
                    background-color: $accent-dark-color;
                    color: $white-text-color;
                }
                &:focus {
                    background-color: $accent-color;
                    color: $light-text-color;
                }
            }
        }
    }
</style>
