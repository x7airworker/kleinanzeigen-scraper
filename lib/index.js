const axios= require('axios')
const cheerio = require('cheerio')
const FS = require('fs')

let config = JSON.parse(FS.readFileSync('config.json'))

config.queries.forEach(async query => {
    const res = await axios.get(query.link, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36'
        }
    })
    const $ = cheerio.load(res.data)
    const {embed} = $('ul#srp-results li').map((i, elem) => {
        try {
            const rawPrice = $(elem).find('.adlist--item--price').first().text().trim().replace('.', '')
            return {
                embed: {
                    type: "rich",
                    url: 'https://m.ebay-kleinanzeigen.de' + $(elem).find('a').first().attr('href'),
                    image: {
                        url: $(elem).find('img').first().attr('data-src')
                    },
                    description: rawPrice,
                    title: $(elem).find('.j-adlistitem-title').first().text().trim()
                },
                query,
                price: parseInt(rawPrice.split(' ')[0])
            }
        } catch(ignored) {}
        return {}
    }).toArray().filter(ad => ad.price >= ad.query.minimum_price).sort((a, b) => a.price - b.price)[0]

    axios.post(config.discord_webhook, {
        embeds: [embed]
    })
})