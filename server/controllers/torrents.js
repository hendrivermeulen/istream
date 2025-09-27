import WebTorrent from "webtorrent";
import { rm } from "fs/promises";
import os from "os";
import fs from "fs";
import {get_movie_link} from "./apis/yts.js";
import {get_movie_4k_hdr_link} from "./apis/piratebay.js";
import axios from "axios";
import path from "path";

const client = new WebTorrent({
    maxConns: 1000
});

const downloadPath = path.join(os.tmpdir(), "torrents")
const trackers = await get_trackers()

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

let file;
let currentTorrent;
let tempFilePath;
let currentLink;
let progressInterval;
let progress;
let movieDuration;

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

function convertToReadableBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = 2 < 0 ? 0 : 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function stream(link, response) {
    currentLink = link;

    client.add(link, {path: downloadPath, announce: trackers}, torrent => {
        currentTorrent = torrent
        file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b))
        torrent.files.forEach(f => f.deselect());
        file.select();

        tempFilePath = file.path;

        progressInterval = setInterval(() => {
            const percentageCompleted = (torrent.progress * 100).toFixed(2)
            const timeLeft = (file.length-torrent.downloaded)/torrent.downloadSpeed/60
            const playable = timeLeft < movieDuration*0.75

            progress = {
                streaming: file.name,
                path: file.path,
                totalSize: convertToReadableBytes(file.length),
                percentageCompleted: percentageCompleted + "%",
                download: convertToReadableBytes(torrent.downloaded),
                downloadSpeed: convertToReadableBytes(torrent.downloadSpeed),
                connectedPeers: torrent.numPeers,
                totalPeers: torrent.wires.length,
                playable: playable
            }
        }, 1000)

        respond(response)
    })
}

export async function pipe(response, title, torrentIndex) {
    const isPirate = torrentIndex.includes("p")
    const index = parseInt((isPirate) ? torrentIndex.slice(1) : torrentIndex);
    let link, duration;
    if(isPirate) {
        [link, duration] = await get_movie_link(title, 0)
        link = await get_movie_4k_hdr_link(title, index)
    } else {
        [link, duration] = await get_movie_link(title, index)
    }
    movieDuration = duration;

    if(link === null){
        response.status(404).send('Not Found')
    }

    if(currentLink === undefined) {
        await stream(link, response);
    } else {
        if (currentLink !== link) {
            clearInterval(progressInterval)
            currentTorrent.destroy();
            progress = defaultProgress
            await stream(link, response);
        } else {
            respond(response)
        }
    }
}

function respond(response){
    if (!file) {
        response.status(404).send('File not found');
    } else {
        if (fs.existsSync(tempFilePath)) {
            response.sendFile(tempFilePath);
        } else {
            response.status(404).send('File not found');
        }
    }
}

export function getProgress() {
    if(currentLink === undefined || progress === undefined) {
        return defaultProgress;
    }
    return progress;
}

// cleanup
await rm(downloadPath, { recursive: true, force: true })
