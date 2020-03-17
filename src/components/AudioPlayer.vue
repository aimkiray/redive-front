<template>
    <div class="audio-player">
        <aplayer @timeupdate="timeUpdate" :audio="audio" :lrcType="3" ref="aplayer" fixed/>

        <el-row>
            <el-col :xs="0" :sm="6"><p></p></el-col>
            <el-col :xs="24" :sm="12">
                <div class="grid-content">
                    <el-button round v-on:click="playCurrent">Play</el-button>
                    <el-button round v-on:click="pauseCurrent">Pause</el-button>
                    <el-button round v-on:click="markA">A</el-button>
                    <el-button round v-on:click="markB">B</el-button>
                    <el-button round v-on:click="proceedCurrent">Proceed</el-button>
                </div>
                <div class="grid-content">
                    <el-divider v-if="!(bMark.length === 0)">Loop</el-divider>
                    <el-button v-for="(mark, index) in bMark" v-bind:key="index" v-on:click="loopAB(index)">{{mark}}
                    </el-button>
                </div>
            </el-col>
        </el-row>

    </div>
</template>

<script>
    // import WaveSurfer from 'wavesurfer.js';
    // import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    // import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';

    export default {
        name: 'AudioPlayer',
        data() {
            return {
                audio: [],
                aMark: [],
                bMark: [],
                isRecord: 0,
                isLoop: 0,
                loopIndex: 0,
                realPlayTime: 0,
                lastPlayTime: 0,
            }
        },
        mounted() {
            this.$axios.get("/audio").then(res => {
                if (res.data.code === 1) {
                    const audioData = res.data.data;
                    // for ()
                    audioData.audio = this.getDownloadURL(audioData.id, "audio", audioData.audio);
                    audioData.cover = this.getDownloadURL(audioData.id, "cover", audioData.cover);
                    audioData.lrc = this.getDownloadURL(audioData.id, "lrc", audioData.lrc);
                    this.audio = audioData
                } else {
                    this.$message({
                        showClose: true,
                        message: "载入失败，请检查你的土豆。",
                        type: "error"
                    });
                }
            }).catch(err => {
                this.$message({showClose: true, message: '你的土豆被吃了。' + err, type: 'error'});
            });
        },
        methods: {
            playCurrent: function () {
                this.$refs.aplayer.play();
            },
            pauseCurrent: function () {
                this.$refs.aplayer.pause();
            },
            proceedCurrent: function () {
                if (this.isRecord) {
                    // Delete record A
                    this.aMark.pop();
                } else {
                    this.$refs.aplayer.seek(this.lastPlayTime);
                }
                this.isLoop = 0;
            },
            markA: function () {
                if (this.isLoop) {
                    this.isLoop = 0;
                    // Seek to last played time
                    this.$refs.aplayer.seek(this.lastPlayTime);
                }
                // Record loop start time
                // If user clicked too much
                if (this.isRecord) {
                    // Delete one
                    this.aMark.pop();
                }
                this.aMark.push(this.realPlayTime);
                this.isRecord = 1;
            },
            markB: function () {
                // Record loop end time
                // Already clicked start and After time A
                if (this.isRecord && this.realPlayTime > this.aMark[this.aMark.length - 1]) {
                    let nowTime = this.realPlayTime;
                    this.bMark.push(nowTime);
                    // Last played time
                    if (nowTime > this.lastPlayTime) {
                        this.lastPlayTime = nowTime
                    }
                    // Last loop index
                    this.loopIndex = this.bMark.length - 1;
                    this.isLoop = 1;
                    this.isRecord = 0;
                }
            },
            timeUpdate: function () {
                // Update current play time
                const {media} = this.$refs.aplayer;
                this.realPlayTime = media.currentTime;
                // Execute loop
                if (this.isLoop && this.realPlayTime >= this.bMark[this.loopIndex]) {
                    this.$refs.aplayer.seek(this.aMark[this.loopIndex])
                }
            },
            loopAB: function (index) {
                if (this.realPlayTime > this.lastPlayTime) {
                    this.lastPlayTime = this.realPlayTime;
                }
                this.$refs.aplayer.seek(this.aMark[index]);
                this.loopIndex = index;
                this.isLoop = 1;
            },
            getDownloadURL(id, type, path) {
                if (path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type + "?token=" +
                            localStorage.getItem("token")
                    } else {
                        return path
                    }
                }
                return ""
            }
        },
    };

</script>

<style lang="scss" scoped>
    .audio-player {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }

    .grid-content {
        margin: 0 0 1rem;
    }

</style>