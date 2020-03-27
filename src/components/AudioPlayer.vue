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

            <p id="subtitle" class="text-center text-info">&nbsp;</p>
            <div id="wave-timeline"></div>
            <div id="waveform"></div>

            <form role="form" name="edit" style="opacity: 1; transition: opacity 300ms linear; margin: 30px 0;">
                <div class="form-group">
                    <label for="start">Start</label>
                    <input class="form-control" id="start" name="start"/>
                </div>

                <div class="form-group">
                    <label for="end">End</label>
                    <input class="form-control" id="end" name="end"/>
                </div>

                <div class="form-group">
                    <label for="note">Note</label>
                    <textarea id="note" class="form-control" rows="3" name="note"></textarea>
                </div>

                <button type="submit" class="btn btn-success btn-block">Save</button>
                <button type="button" class="btn btn-danger btn-block" data-action="delete-region">Delete</button>
            </form>

            <el-col :xs="0" :sm="6"><p></p></el-col>
            <el-col :xs="24" :sm="12">
                <div class="grid-content">
                    <el-button round v-on:click="playAudio">Play</el-button>
                    <el-button round v-on:click="pauseAudio">Pause</el-button>
                    <!--                    <el-button round v-on:click="markA">A</el-button>-->
                    <!--                    <el-button round v-on:click="markB">B</el-button>-->
                    <el-button round v-on:click="proceedAudio">Proceed</el-button>
                </div>
                <!--                <div class="grid-content">-->
                <!--                    <el-divider v-if="!(bMark.length === 0)">Loop</el-divider>-->
                <!--                    <el-button v-for="(mark, index) in bMark" v-bind:key="index" v-on:click="loopAB(index)">{{mark}}-->
                <!--                    </el-button>-->
                <!--                </div>-->
            </el-col>
        </el-row>

    </div>
</template>

<script>
    import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

    export default {
        name: 'AudioPlayer',
        data() {
            return {
                audioList: [],
                regionData: "",
                isRecord: false,
                isLoop: false,
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
                this.isLoop = 0;
            },
            regionLoop() {
                // Execute loop
                this.aplayer.seek(this.currentRegion.start);
                this.aplayer.play();
                this.currentRegion.once('out', () => {
                    if (this.isLoop) {
                        this.regionLoop()
                    } else if (
                        this.audioElt.currentTime < this.currentRegion.end &&
                        this.audioElt.currentTime > this.currentRegion.start
                    ) {
                        this.aplayer.pause();
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
                this.needGenWave = true
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
                    this.saveRegions();

                    this.wavesurfer.on('region-click', (region, e) => {
                        this.currentRegion = region;
                        e.stopPropagation();
                        // Play on click, loop on ctrl click
                        e.ctrlKey ? this.isLoop = true : this.isLoop = false;
                        this.regionLoop()
                    });
                    this.wavesurfer.on('region-click', this.editAnnotation);
                    this.wavesurfer.on('region-updated', this.saveRegions);
                    this.wavesurfer.on('region-removed', this.saveRegions);
                    this.wavesurfer.on('region-in', this.showNote);
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
            editAnnotation(region) {
                const form = document.forms.edit;
                form.style.opacity = 1;
                (form.elements.start.value = Math.round(region.start * 10) / 10),
                    (form.elements.end.value = Math.round(region.end * 10) / 10);
                form.elements.note.value = region.data.note || '';
                form.onsubmit = function (e) {
                    e.preventDefault();
                    region.update({
                        start: form.elements.start.value,
                        end: form.elements.end.value,
                        data: {
                            note: form.elements.note.value
                        }
                    });
                    form.style.opacity = 0;
                };
                form.onreset = function () {
                    form.style.opacity = 0;
                    form.dataset.region = null;
                };
                form.dataset.region = region.id;
            },
            /**
             * Display annotation
             */
            showNote(region) {
                if (!this.showNote.el) {
                    this.showNote.el = document.querySelector('#subtitle');
                }
                this.showNote.el.textContent = region.data.note || '–';
            },
        },
    };

</script>

<style lang="scss" scoped>
    .audio-player {
        margin-top: 60px;
    }

    .grid-content {
        margin: 0 0 1rem;
    }

</style>
