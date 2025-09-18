import axios from 'axios'
import * as cheerio from 'cheerio';

export async function get_popular(page=1, genre=""){
    const response = await axios.get('https://www.themoviedb.org/movie?with_original_language=en&page='+page+'&with_genres='+genre);
    const $ = cheerio.load(response.data);
    const cards = $('div.card.style_1');
    const movies = [];
    cards.each((index, element) => {
        const title = $(element).find('a').text().trim()
        if(title !== ""){
            const date = $(element).find('p').text().trim()
            if(date !== ""){
                const year = date.match(/\b\d{4}\b/);
                const image = $(element).find('img').attr('src').trim()
                const full_title = title + " " + year
                const url = "/movie?title=" + full_title.replace(/\s/g, '+');
                movies.push({title: full_title, image: image, url: url});
            }
        }
    });
    return movies;
}