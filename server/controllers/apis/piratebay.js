import axios from "axios";
import * as cheerio from 'cheerio';

const fullHD = ' 1080p/1/99/207';
const uhd = ' atmos/1/99/211';
const indexMap = {0: fullHD, 1: uhd};

let detailsCache = {}
let linksCache = {}

export async function get_pirate_search_results(movie_name){
    if(detailsCache[movie_name]){
        return detailsCache[movie_name];
    }

    const response = await
        axios.get('https://piratebay.party/search/' + movie_name + ' atmos/1/99/211');

    let results = []
    const $ = cheerio.load(response.data);
    $('tr').each((index, row) => {
        const columns = $(row).find('td')
        if(columns.length > 0 && results.length < 3) {
            results.push({
                quality: "4K Atmos",
                peers: $(columns[5]).text(),
                seeds: $(columns[6]).text()
            });
        }
    })

    detailsCache[movie_name] = results;
    return results;
}

async function get_first_result(request, index){
    const response = await
        axios.get('https://piratebay.party/search/' + request);
    const $ = cheerio.load(response.data);
    const rows = $('tr');
    if(rows.length > 1){
        const row = rows.eq(1);
        const columns = row.find('td')
        return {
            quality: indexMap[index],
            peers: $(columns[5]).text(),
            seeds: $(columns[6]).text()
        }
    }
    return null
}

async function get_link(request, index){
    const query = request + index
    if(linksCache[query]){
        return linksCache[query];
    }

    const response = await axios.get('https://piratebay.party/search/' + request);
    const $ = cheerio.load(response.data);
    const rows = $('tr');
    let result;
    if(rows.length > 2){
        const row = rows.eq(index+1);
        const columns = row.find('td')
        const magnet = $(columns[3]).find('a')
        result = magnet.attr('href');
    } else {
        result = null
    }
    linksCache[query] = result;
    return result
}

export async function get_movie_1080_link(movie_name, index){
    return await get_link(movie_name + fullHD, index);
}

export async function get_movie_4k_hdr_link(movie_name, index){
    return await get_link(movie_name + uhd, index);
}