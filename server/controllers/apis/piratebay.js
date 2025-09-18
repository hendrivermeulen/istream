import axios from "axios";
import * as cheerio from 'cheerio';

export async function get_movie_4k_hdr_details(movie_name){
    const response = await
        axios.get('https://piratebay.party/search/' + movie_name + ' atmos/1/99/211');
    const $ = cheerio.load(response.data);
    const rows = $('tr');
    if(rows.length > 1){
        const row = rows.eq(1);
        const columns = row.find('td')
        return {
            quality: "2160p Atmos",
            peers: $(columns[5]).text(),
            seeds: $(columns[6]).text()
        }
    }
    return null
}

export async function get_movie_4k_hdr_link(movie_name){
    const response = await
        axios.get('https://piratebay.party/search/' + movie_name + ' atmos/1/99/211');
    const $ = cheerio.load(response.data);
    const rows = $('tr');
    if(rows.length > 1){
        const row = rows.eq(1);
        const columns = row.find('td')
        const magnet = $(columns[3]).find('a')
        return magnet.attr('href');
    }
}