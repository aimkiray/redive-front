<template>
    <div>
        <aplayer
                @canplay="genPlayer"
                @listSwitch="switchAudio"
                @timeupdate="changeCurrentTime"
                :audio="audioList"
                :lrcType="3"
                ref="aplayer"
                fixed
                filled/>

        <p id="regionNote" class="region-note"></p>
        <div id="wave-timeline"></div>
        <div id="waveform"></div>

        <el-row class="audio-player-control">

            <el-col :xs="24" :sm="12" class="audio-player-control">
                <div class="grid-content">
                    <el-button round v-on:click="playAudio">Play</el-button>
                    <el-button round v-on:click="pauseAudio">Pause</el-button>
                    <el-button round v-on:click="markA">A</el-button>
                    <el-button round v-on:click="markB">B</el-button>
                    <el-button round v-on:click="proceedAudio">打断</el-button>
                    <el-button round v-on:click="saveRegions">刻进DNA</el-button>

                    <div style="display: inline-block; float: right" v-if="regionForm.start">
                        <el-popover
                                placement="bottom"
                                width="260"
                                trigger="click"
                                ref="regionPopover">
                            <el-form :model="regionForm"
                                     ref="regionForm"
                                     label-width="40px"
                                     label-position="top"
                                     class="region-form-container">
                                <el-row :gutter="10">
                                    <el-col :sm="12">
                                        <el-form-item label="Start" size="mini">
                                            <el-input-number
                                                    v-model="regionForm.start"
                                                    style="display: block"
                                                    controls-position="right"
                                                    :precision="1"
                                                    :step="0.1">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :sm="12">
                                        <el-form-item label="End" size="mini">
                                            <el-input-number
                                                    v-model="regionForm.end"
                                                    style="display: block"
                                                    controls-position="right"
                                                    :precision="1"
                                                    :step="0.1">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                <el-form-item label="Note" size="mini">
                                    <el-input
                                            type="textarea"
                                            v-model="regionForm.note"
                                            rows="4">
                                    </el-input>
                                </el-form-item>
                            </el-form>
                            <div style="text-align: right; margin: 0">
                                <el-button size="mini" type="error" @click="deleteRegion">删除</el-button>
                                <el-button size="mini" type="primary" @click="editRegion">保存</el-button>
                            </div>
                            <el-button slot="reference">修改</el-button>
                        </el-popover>
                    </div>
                </div>

            </el-col>

            <el-col :xs="0" :sm="6"><p></p></el-col>
        </el-row>

        <el-row class="lyric-container">
            <LyricScroll
                    v-if="originLyric !== null || originTLyric !== null"
                    :lyric="lyric"
                    :t-lyric="tLyric"
                    :current-time="currentTime"
                    @change-current-time="redirectTime"></LyricScroll>
        </el-row>

    </div>
</template>

<script>
    import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';

    import LyricScroll from './LyricScroll'

    export default {
        name: 'AudioPlayer',
        components: {
            LyricScroll
        },
        data() {
            return {
                audioList: [],
                regionData: "",
                regionForm: {
                    start: "",
                    end: "",
                    note: ""
                },
                isRecord: false,
                isLoop: false,
                currentTime: 0,
                currentRegion: null,
                realPlayTime: 0,
                lastPlayTime: 0,
                needGenWave: true,
                needGenLyric: true,
                originLyric: null,
                originTLyric: null,
                tempStr: "",
            }
        },
        mounted() {
            this.$axios.get("/audio").then(res => {
                if (res.data.code === 1) {
                    const audioRaw = res.data.data;
                    for (let i = 0, len = audioRaw.length; i < len; i++) {
                        const audioID = audioRaw[i].id;
                        // Generate file download link
                        audioRaw[i].url = this.getDownloadURL(audioID, "audio", audioRaw[i].audio);
                        audioRaw[i].cover = this.getDownloadURL(audioID, "cover", audioRaw[i].cover);
                        audioRaw[i].lrc = this.getDownloadURL(audioID, "lrc", audioRaw[i].lrc);
                        audioRaw[i].tlrc = this.getDownloadURL(audioID, "tlrc", audioRaw[i].tlrc);
                    }
                    this.audioList = audioRaw
                } else {
                    this.$message({
                        showClose: true,
                        message: "音频加载失败，内部错误。",
                        type: "error"
                    });
                }
            }).catch(err => {
                this.$message({showClose: true, message: '音频加载失败。' + err, type: 'error'});
            });

            this.$nextTick(() => {
                this.wavesurfer = WaveSurfer.create({
                    container: '#waveform',
                    height: 150,
                    pixelRatio: 1,
                    scrollParent: true,
                    normalize: true,
                    minimap: true,
                    backend: 'MediaElement',
                    autoplay: true,
                    removeMediaElementOnDestroy: false,
                    reloadMediaElement: false,
                    loopSelection: false,
                    playbackRate: this.audioElt.playbackRate,
                    volume: this.audioElt.volume,
                    plugins: [
                        RegionsPlugin.create(),
                        MinimapPlugin.create({
                            height: 30,
                            waveColor: '#ddd',
                            progressColor: '#999',
                            cursorColor: '#999'
                        }),
                        TimelinePlugin.create({
                            container: '#wave-timeline'
                        })
                    ]
                });
            })
        },
        computed: {
            baseURL() {
                return this.$axios.defaults.baseURL
            },
            audioElt() {
                return this.$refs.aplayer.media
            },
            aplayer() {
                return this.$refs.aplayer
            },
            // 原词，格式为{xx: 歌词, ...}，xx为该词开始时间
            lyric() {
                return this.lyricToObj(this.originLyric)
            },
            // 译词，格式同原词
            tLyric() {
                return this.lyricToObj(this.originTLyric)
            }
        },
        methods: {
            playAudio() {
                this.aplayer.play();
            },
            pauseAudio() {
                this.aplayer.pause();
            },
            proceedAudio() {
                this.isLoop = false;
            },
            markA() {

            },
            markB() {

            },
            // 将00:00.00转换为秒数
            timeStrToNum(str) {
                let minute = Number(str.slice(0, 2));
                let second = Number(str.slice(3, 5));
                let minSec = Number(str.slice(6, 8));
                return minute * 60 + second + minSec / 100
            },
            // 将歌词字符串转换为对象，格式为{开始时间: 歌词, ...}
            lyricToObj(lyricStr) {
                if (lyricStr === null) {
                    return null
                }
                let obj = {};
                let perLyric;
                let time;
                lyricStr.split('\n').forEach((item) => {
                    perLyric = item.slice(item.indexOf(']') + 1);
                    if (perLyric) {
                        time = this.timeStrToNum(item.slice(1, 9));
                        obj[time] = perLyric
                    }
                });
                return obj
            },
            changeCurrentTime(newTime) {
                this.currentTime = newTime
            },
            redirectTime(newTime) {
                this.wavesurfer.play(newTime);
            },
            regionLoop() {
                // Execute loop
                this.wavesurfer.play(this.currentRegion.start);
                if (this.wavesurfer.paused) {
                    this.wavesurfer.play()
                }
                this.currentRegion.once('out', () => {
                    // Update current play time
                    this.realPlayTime = this.audioElt.currentTime;
                    if (this.isLoop) {
                        return this.regionLoop()
                    } else if (
                        this.realPlayTime <= this.currentRegion.end &&
                        this.realPlayTime >= this.currentRegion.start
                    ) {
                        this.wavesurfer.pause();
                    }
                });
            },
            switchAudio() {
                // 生成歌词
                this.needGenLyric = true;

                // 生成波形和控件
                this.regionData = "";
                this.wavesurfer.clearRegions();
                this.needGenWave = true;
            },
            genPlayer() {
                if (this.needGenLyric) {
                    this.needGenLyric = false;
                    // eslint-disable-next-line no-console
                    // this.originLyric = this.aplayer.lyric.lrc;
                    // this.originTLyric = this.aplayer.lyric.tlrc
                }
                if (this.needGenWave) {
                    this.needGenWave = false;
                    this.genWave()
                }
            },
            genWave() {
                this.wavesurfer.load(this.audioElt.audio);

                /* Regions */

                this.wavesurfer.enableDragSelection({
                    color: this.randomColor(0.1)
                });

                // load exist regions
                if (this.regionData) {
                    this.loadRegions(this.regionData);
                }

                this.wavesurfer.on('region-click', (region, e) => {
                    this.currentRegion = region;
                    this.showEditor();
                    e.stopPropagation();
                    // Play on click, loop on ctrl click
                    // e.ctrlKey ? region.playLoop(region.start) : region.play(region.start);
                    e.ctrlKey ? this.isLoop = true : this.isLoop = false;
                    this.regionLoop()
                });
                this.wavesurfer.on('region-in', this.showNote);
            },
            /**
             * Save annotations to server
             */
            saveRegions() {
                const regions = this.wavesurfer.regions.list;
                this.regionData = JSON.stringify(
                    Object.keys(regions).map(function (id) {
                        const region = regions[id];
                        return {
                            start: region.start,
                            end: region.end,
                            attributes: region.attributes,
                            data: region.data
                        };
                    })
                );
                const audioBody = new FormData();
                audioBody.set('regions', "'" + this.regionData + "'");
                this.$axios.put("/audio/" + this.aplayer.currentMusic.id +
                    "?token=" + localStorage.getItem("token"), audioBody).then(res => {
                    if (res.data.code === 1) {
                        this.$message({
                            showClose: true,
                            message: "保存成功。",
                            type: "success"
                        });
                    }
                }).catch(err => {
                    this.$message({
                        showClose: true,
                        message: "保存失败。" + err,
                        type: "success"
                    });
                })
            },
            /**
             * Load regions from server
             */
            loadRegions(regions) {
                regions.forEach(region => {
                    region.color = this.randomColor(0.1);
                    this.wavesurfer.addRegion(region);
                });
            },
            deleteRegion() {
                this.wavesurfer.regions.list[this.currentRegion.id].remove();
                this.resetRegionPopover()
            },
            /**
             * Edit annotation for a region
             */
            showEditor() {
                this.regionForm.start = Math.round(this.currentRegion.start * 10) / 10;
                this.regionForm.end = Math.round(this.currentRegion.end * 10) / 10;
                this.regionForm.note = this.currentRegion.data.note || '';
            },
            editRegion() {
                this.currentRegion.update({
                    start: this.regionForm.start,
                    end: this.regionForm.end,
                    data: {
                        note: this.regionForm.note
                    }
                });
                this.resetRegionPopover()
            },
            resetRegionPopover() {
                document.querySelector("#app").click();
                this.regionForm = {
                    start: "",
                    end: "",
                    note: ""
                };
            },
            /**
             * Extract regions separated by silence
             */
            extractRegions(peaks, duration) {
                // Silence params
                let minValue = 0.0015;
                let minSeconds = 0.25;

                let length = peaks.length;
                let coef = duration / length;
                let minLen = minSeconds / coef;

                // Gather silence indeces
                let silences = [];
                Array.prototype.forEach.call(peaks, function (val, index) {
                    if (Math.abs(val) <= minValue) {
                        silences.push(index);
                    }
                });

                // Cluster silence values
                let clusters = [];
                silences.forEach(function (val, index) {
                    if (clusters.length && val == silences[index - 1] + 1) {
                        clusters[clusters.length - 1].push(val);
                    } else {
                        clusters.push([val]);
                    }
                });

                // Filter silence clusters by minimum length
                let fClusters = clusters.filter(function (cluster) {
                    return cluster.length >= minLen;
                });

                // Create regions on the edges of silences
                let regions = fClusters.map(function (cluster, index) {
                    let next = fClusters[index + 1];
                    return {
                        start: cluster[cluster.length - 1],
                        end: next ? next[0] : length - 1
                    };
                });

                // Add an initial region if the audio doesn't start with silence
                let firstCluster = fClusters[0];
                if (firstCluster && firstCluster[0] != 0) {
                    regions.unshift({
                        start: 0,
                        end: firstCluster[firstCluster.length - 1]
                    });
                }

                // Filter regions by minimum length
                let fRegions = regions.filter(function (reg) {
                    return reg.end - reg.start >= minLen;
                });

                // Return time-based regions
                return fRegions.map(function (reg) {
                    return {
                        start: Math.round(reg.start * coef * 10) / 10,
                        end: Math.round(reg.end * coef * 10) / 10
                    };
                });
            },
            /**
             * Random RGBA color
             */
            randomColor(alpha) {
                return (
                    'rgba(' +
                    [
                        ~~(Math.random() * 255),
                        ~~(Math.random() * 255),
                        ~~(Math.random() * 255),
                        alpha || 1
                    ] +
                    ')'
                );
            },
            /**
             * Display annotation
             */
            showNote(region) {
                if (!this.showNote.el) {
                    this.showNote.el = document.querySelector('#regionNote');
                }
                this.showNote.el.textContent = region.data.note || '';
            },
            getDownloadURL(id, type, path) {
                if (path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type
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
    .audio-player-control {
        /*margin-top: 60px;*/
    }

    .region-note {
        height: 1rem;
    }

    .audio-player-control {
        margin: 1rem 1rem;
    }

    .grid-content {
        margin: 0 0 1rem;
    }

    .lyric-container {
        height: 100%;
    }

</style>
