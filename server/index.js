import {pipe, getProgress} from './controllers/torrents.js'
import express from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import {get_popular} from './controllers/apis/tmdb.js'
import {get_movie_details, get_movies} from "./controllers/apis/yts.js";
import os from "os";
import fs from "fs";
import {get_movie_4k_hdr_details, get_movie_4k_hdr_link} from "./controllers/apis/piratebay.js";

const app = express();
const PORT = 3000;

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

function home(res, title, movies, page, searchQuery, genre){
    if(page === undefined){
        page = 1
    } else {
        page = parseInt(page);
    }
    const hasMore = movies.length === 20;
    res.render("home",
        {title: title, movies: movies, next_page:(page+1), hasMore: hasMore, searchQuery: searchQuery, genre: genre})
}

app.get('/', async (req, res) => {
    const movies = await get_popular(req.query.page, req.query.genre)
    home(res, "iStream", movies, req.query.page, "", req.query.genre)
});

app.get('/search', async (req, res) => {
    const movies = await get_movies(req.query.query, req.query.page)
    home(res, "Search", movies, req.query.page, req.query.query, "")
});

app.get('/movie', async (req, res) => {
    const movie_details = await get_movie_details(req.query.title);
    const hdr_movie = await get_movie_4k_hdr_details(req.query.title)
    if(movie_details === null){
        res.status(404).render('404')
    } else {
        res.render("movie",
            {title: movie_details.title, movie: movie_details, hdr_movie: hdr_movie});
    }
});

app.get('/stream', async (req, res) => {
    await pipe(res, req.query.title, req.query.torrent)
});

app.get('/stream/progress', async (req, res) => {
    res.json(getProgress())
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// cleanup
fs.readdir(os.tmpdir(), (err, files) => {
    if(err === null){
        const tempFiles = files.filter(file => file.startsWith('istream_'));
        tempFiles.map(file =>
            fs.unlink(path.join(os.tmpdir(), file), ()=>console.log("Deleted old file: " + file))
        );
    }
})