import torrentStream from "torrent-stream";
import path from "path";
import os from "os";
import fs from "fs";
import axios from "axios";
import {get_movie_link} from "./apis/yts.js";
import e from "express";
import {get_movie_4k_hdr_link} from "./apis/piratebay.js";

const defaultProgress = {
    streaming: "",
    path: "",
    totalSize: "0",
    percentageCompleted: "0",
    download: "0",
    downloadSpeed: "0",
    connectedPeers: 0,
    totalPeers: 0,
    duration: 0
}

let engine;
let file;
let total;
let tempFilePath;
let currentLink;
let progressInterval;
let progress;
let movieDuration;

function convertToReadableBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = 2 < 0 ? 0 : 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function loadProgress() {
    const unchoked = engine.swarm.wires.filter(wire => !wire.peerChoking)
    const percentageCompleted = (engine.swarm.downloaded * 1.0 / total * 100).toFixed(2)
    const timeLeft = (total-engine.swarm.downloaded)/engine.swarm.downloadSpeed()/60
    const playable = timeLeft < movieDuration*0.75
    progress = {
        streaming: file.name,
        path: tempFilePath,
        totalSize: convertToReadableBytes(total),
        percentageCompleted: percentageCompleted + "%",
        download: convertToReadableBytes(engine.swarm.downloaded),
        downloadSpeed: convertToReadableBytes(engine.swarm.downloadSpeed()),
        connectedPeers: unchoked.length,
        totalPeers: engine.swarm.wires.length,
        playable: playable
    }
}

async function get_trackers(){
    const url = 'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt';
    const response = await axios.get(url)
    const data = response.data;
    const externalTrackers = data.split('\n').map(line => line.trim()).filter(line => line !== '');
    const ytsTrackers = ["udp://open.demonii.com:1337/announce", "udp://tracker.openbittorrent.com:80",
        "dp://tracker.coppersurfer.tk:6969", "udp://glotorrents.pw:6969/announce",
        "udp://tracker.opentrackr.org:1337/announce", "udp://torrent.gresille.org:80/announce",
        "udp://p4p.arenabg.com:1337", "udp://tracker.leechers-paradise.org:6969]"]
    return externalTrackers.concat(ytsTrackers);
}

async function stream(link, response) {
    currentLink = link;

    const opts = {
        connections: 1000,
        uploads: 10,
        verify: true,
        trackers: await get_trackers()
    }

    engine = torrentStream(link, opts)

    engine.on('ready', () => {
        let maxSize = -1;
        engine.files.forEach(f => {
            if(f.length > maxSize) {
                maxSize = f.length;
                file = f;
            }
        })
        total = file.length;

        tempFilePath = path.join(os.tmpdir(), `istream_${file.name}`);
        const tempFileStream = fs.createWriteStream(tempFilePath);
        file.createReadStream().pipe(tempFileStream);

        progressInterval = setInterval(() => loadProgress(), 1000)

        respond(response)
    });

    engine.on('error', (err) => {
        console.error(err);
    });
}

export async function pipe(response, title, torrentIndex) {
    const index = parseInt(torrentIndex);
    let link, duration;
    if(index === -1) {
        [link, duration] = await get_movie_link(title, 0)
        link = await get_movie_4k_hdr_link(title)
    } else {
        [link, duration] = await get_movie_link(title, index)
    }
    movieDuration = duration;

    if(link === null){
        response.status(404).send('Not Found')
    }

    if(engine === undefined) {
        await stream(link, response);
    } else {
        if (currentLink !== link) {
            clearInterval(progressInterval)
            engine.destroy()
            await stream(link, response);
        } else {
            respond(response)
        }
    }
}

function respond(response){
    if (!file) {
        response.status(404).send('File not found');
    }

    if (fs.existsSync(tempFilePath)) {
        response.sendFile(tempFilePath);
    } else {
        response.status(404).send('File not found');
    }
}

export function getProgress() {
    if(engine === undefined || progress === undefined) {
        return defaultProgress;
    }
    return progress;
}
