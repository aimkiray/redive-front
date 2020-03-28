<template>
    <div>
        <aplayer
                @canplay="genWave"
                @listSwitch="switchAudio"
                :audio="audioList"
                :lrcType="3"
                ref="aplayer"
                fixed/>

        <el-row class="audio-player">

            <p id="subtitle"></p>
            <div id="wave-timeline"></div>
            <div id="waveform"></div>

            <el-col :xs="24" :sm="12" class="audio-player-control">
                <div class="grid-content">
                    <el-button round v-on:click="playAudio">Play</el-button>
                    <el-button round v-on:click="pauseAudio">Pause</el-button>
                    <!--                    <el-button round v-on:click="markA">A</el-button>-->
                    <!--                    <el-button round v-on:click="markB">B</el-button>-->
                    <el-button round v-on:click="proceedAudio">打断</el-button>

                    <div style="display: inline-block; float: right" v-if="regionData">
                        <el-button type="primary" @click="editRegion">保存</el-button>
                        <el-button @click="deleteRegion">删除</el-button>
                    </div>
                </div>

                <el-form :model="regionForm"
                         ref="regionForm"
                         v-if="regionData"
                         label-width="40px"
                         class="region-form-container">
                    <el-row :gutter="20">
                        <el-col :xs="24" :sm="8">
                            <el-form-item label="Start">
                                <el-input-number
                                        v-model="regionForm.start"
                                        controls-position="right"
                                        style="display: block"
                                        :precision="1" :step="0.1">
                                </el-input-number>
                            </el-form-item>
                            <el-form-item label="End">
                                <el-input-number
                                        v-model="regionForm.end"
                                        controls-position="right"
                                        style="display: block"
                                        :precision="1" :step="0.1">
                                </el-input-number>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="16">
                            <el-form-item label="Note">
                                <el-input type="textarea" v-model="regionForm.note"
                                          rows="4"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-col>

            <el-col :xs="0" :sm="6"><p></p></el-col>
        </el-row>

    </div>
</template>

<script>
    import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';

    export default {
        name: 'AudioPlayer',
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
                isRepeat: false,
                currentRegion: null,
                realPlayTime: 0,
                lastPlayTime: 0,
                needGenWave: true,
            }
        },
        mounted() {
            this.$axios.get("/audio").then(res => {
                if (res.data.code === 1) {
                    const audioRaw = res.data.data;
                    for (let i = 0, len = audioRaw.length; i < len; i++) {
                        const audioID = audioRaw[i].id;
                        // 生成文件下载链接
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
                this.isRepeat = false;
                this.isLoop = false;
            },
            regionLoop() {
                // Update current play time
                // this.realPlayTime = this.audioElt.currentTime;
                // // Execute loop
                // if (this.isRepeat && this.realPlayTime >= this.currentRegion.end) {
                //     if (this.isLoop) {
                //         this.aplayer.seek(this.currentRegion.start);
                //     } else {
                //         this.aplayer.pause();
                //     }
                // }

                // Execute loop
                this.wavesurfer.play(this.currentRegion.start);
                if (this.audioElt.paused) {
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
            getDownloadURL(id, type, path) {
                if (path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type
                    } else {
                        return path
                    }
                }
                return ""
            },
            switchAudio() {
                this.regionData = "";
                this.needGenWave = true;
            },
            genWave() {
                if (this.needGenWave) {
                    this.wavesurfer.load(this.audioElt.audio);
                    this.needGenWave = false;

                    /* Regions */

                    this.wavesurfer.enableDragSelection({
                        color: this.randomColor(0.1)
                    });

                    // load exist regions
                    if (this.regionData) {
                        this.loadRegions(this.regionData);
                    }
                    // this.saveRegions();

                    this.wavesurfer.on('region-click', (region, e) => {
                        this.currentRegion = region;
                        this.showEditor();
                        e.stopPropagation();
                        // Play on click, loop on ctrl click
                        e.ctrlKey ? region.playLoop(region.start) : region.play(region.start);
                        // e.ctrlKey ? this.isLoop = true : this.isLoop = false;
                        // this.isRepeat = true;
                        // this.aplayer.seek(this.currentRegion.start);
                        // if (this.audioElt.paused) {
                        //     this.aplayer.play()
                        // }
                        // this.regionLoop()
                    });
                    // this.wavesurfer.on('region-updated', this.saveRegions);
                    // this.wavesurfer.on('region-removed', this.saveRegions);
                    this.wavesurfer.on('region-in', this.showNote);

                    // this.wavesurfer.on('region-play', function(region) {
                    //     region.once('out', function() {
                    //         this.wavesurfer.play(region.start);
                    //         this.wavesurfer.pause();
                    //     });
                    // });
                }
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
                this.$axios.put("/audio/" + this.aplayer.currentMusic.id, {
                    regions: this.regionData
                }).then(res => {
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
                this.regionForm = {
                    start: "",
                    end: "",
                    note: ""
                }
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
            },
            /**
             * Display annotation
             */
            showNote(region) {
                if (!this.showNote.el) {
                    this.showNote.el = document.querySelector('#subtitle');
                }
                this.showNote.el.textContent = region.data.note || '';
            },
        },
    };

</script>

<style lang="scss" scoped>
    .audio-player {
        /*margin-top: 60px;*/
    }

    .audio-player-control {
        margin: 1rem 1rem;
    }

    .grid-content {
        margin: 0 0 1rem;
    }

    /*.region-form-container {*/
    /*    opacity: 1;*/
    /*    transition: opacity 300ms linear;*/
    /*}*/

</style>
