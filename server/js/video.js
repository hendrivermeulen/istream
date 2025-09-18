const video = document.getElementById("video");
const progress = document.getElementById("progress");

let time = 0;
let started = false;
let timeChecker;
let isFullScreen = false;

function retry(){
    const stoppedTime = time;
    clearTimeout(timeChecker);
    video.load()
    video.currentTime = stoppedTime;
    video.play();
}

function stream(index, query_term){
    console.log("Loading: " + "/stream?title=" + query_term + "&torrent=" + index);
    video.src = "/stream?title=" + query_term + "&torrent=" + index;
    retry()
}

function play(){
    video.play();
}

function pause(){
    video.pause();
}

function fullscreen(){
    if(isFullScreen){
        video.style=""
    } else {
        video.style="position: fixed; top: 0; left: 0; width: 1920px; height: 1080px;"
    }
    isFullScreen = !isFullScreen
}

video.addEventListener("error", e => {
    if(started){
        retry()
    } else {
        setTimeout(()=>{video.load()}, 5000)
    }
})

video.addEventListener("play", e => {
    started = true;
    if(timeChecker !== undefined){
        clearTimeout(timeChecker);
    }
    timeChecker = setInterval(() => {
        if(video.currentTime <= time + 10) {
            time = video.currentTime
        }
    }, 5000)
})

video.addEventListener("ended", e => {
    if(time + 10 < video.duration){
        retry()
    }
});

setInterval(()=>{
    fetch('/stream/progress')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        }).then(data => {
            progress.innerHTML = "Streaming: " + data.streaming + "<br> Completed " + data.percentageCompleted +
                " Size: " + data.totalSize + " Speed: " + data.downloadSpeed + " Peer Ratio: " +
                data.connectedPeers +"/" + data.totalPeers;
            if(data.playable){
                progress.style.color = "green"
            } else {
                progress.style.color = "red"
            }
    }).catch(error => {console.error('Fetch error:', error);});
}, 1000);