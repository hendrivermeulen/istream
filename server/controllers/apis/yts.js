import axios from "axios";

let detailsCache = {}
let linksCache = {}

export async function get_movie_details(movie_name){
    const query_term = movie_name.replace(/\s/g, '+')

    if(detailsCache[query_term]){
        return detailsCache[query_term];
    }

    const response = await
        axios.get('https://yts.mx/api/v2/list_movies.json?query_term='+query_term);

    const data = response.data.data;
    if(data.movie_count === 0 || data.movies === undefined){
        return null
    }
    const movie = data.movies[0];

    const src = "/stream?title="+query_term
    const result = {
        title: movie_name,
        query_term: query_term,
        id: movie.id,
        image: movie.large_cover_image,
        duration: movie.runtime,
        src: src,
        torrents: movie.torrents
    }

    detailsCache[query_term] = result;
    return result
}

export async function get_movies(query, page){
    const query_term = (query == undefined) ? "" : query.replace(/\s/g, '+')
    const response = await
        axios.get('https://yts.mx/api/v2/list_movies.json?query_term='+query_term+"&page="+page+"&sort_by=download_count");

    const data = response.data.data;

    if(data.movie_count === 0){
        return []
    }

    const movies = [];
    data.movies.forEach(movie => {
        const full_title = movie.title + " " + movie.year;
        const url = "/movie?title=" + full_title.replace(/\s/g, '+');
        movies.push({title: full_title, image: movie.large_cover_image, url: url});
    })

    return movies;
}

export async function get_movie_link(movie_name, index){
    const query_term = movie_name.replace(/\s/g, '+')

    const query = query_term+index
    if(linksCache[query]){
        return linksCache[query];
    }

    const response = await
        axios.get('https://yts.mx/api/v2/list_movies.json?query_term='+query_term);

    const data = response.data.data;
    if(data.movie_count === 0){
        return null
    }
    const movie = data.movies[0];

    const hash = movie.torrents[index].hash
    const result = ["magnet:?xt=urn:btih:"+hash+"&dn="+query_term+"&tr=http://track.one:1234/announce&tr=udp://track.two:80", movie.runtime];

    linksCache[query] = result;
    return result
}