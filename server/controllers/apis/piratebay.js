import axios from "axios";
import * as cheerio from 'cheerio';

let detailsCache = {}

export async function get_pirate_search_results(movie_name){
    if(detailsCache[movie_name]){
        return detailsCache[movie_name];
    }

    const response = await
        axios.get('https://piratebay.party/search/' + movie_name + '/1/99/207');

    let results = []
    const $ = cheerio.load(response.data);
    const rows = $('tr');

    let haveUHDHDR = false;
    let haveUHDAtmos = false;
    let haveUHD = false;
    let haveFullHD = false;

    rows.each((index, row) => {
        const columns = $(row).find('td')
        if(columns.length > 0 && results.length < 4) {
            const size = parseFloat($(columns[4]).text().replaceAll("GiB", ""))
            if(size > 25){
                return;
            }

            const seeds = parseInt($(columns[5]).text())
            const peers = parseInt($(columns[6]).text())
            if(seeds + peers < 30){
                return false;
            }

            const name = $(columns[1]).text().toLowerCase();
            const isFullHD = name.includes("1080")
            const isUHD = !isFullHD && (name.includes("4k") || name.includes("uhd") || name.includes("2160"))
            const isHDR = name.includes("hdr")
            const isAtmos = name.includes("atmos")

            let add = false;
            if(!haveFullHD && isFullHD) {
                add = true;
                haveFullHD = true;
            } else {
                if(!haveUHDHDR && isUHD && isHDR) {
                    add = true;
                    haveUHDHDR = true;
                    if(isAtmos){
                        haveUHDAtmos = true;
                    }
                } else {
                    if(!haveUHDAtmos && isUHD && isAtmos) {
                        add = true;
                        haveUHDAtmos = true;
                        if(isHDR){
                            haveUHDHDR = true;
                        }
                    } else {
                        if(!haveUHD && isUHD) {
                            add = true;
                            haveUHD = true;
                        }
                    }
                }
            }

            if(add){
                const magnet = $(columns[3]).find('a').attr('href')
                results.push({
                    quality: ((isFullHD) ? "1080p" : "") + ((isUHD) ? "2160p" : "") + ((isHDR) ? " HDR" : "") + ((isAtmos) ? " Atmos" : ""),
                    seeds: seeds,
                    peers: peers,
                    magnet: magnet
                });
            }
        }
    });

    detailsCache[movie_name] = results;
    return results;
}

export async function get_link(movie_name, index){
    const results = await get_pirate_search_results(movie_name);
    return results[index].magnet;
}