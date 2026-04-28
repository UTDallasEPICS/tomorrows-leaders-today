// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';

const scraper = {};

scraper["grants.gov"] = async (query, rows = 500) => {
    const endpoint = 'https://api.grants.gov/v1/api/search2';

    const body = {
        keyword: query,
        oppStatuses: "forecasted|posted",
        rows: rows,
        startRecordNum: 0,
    };

    const resp = await axios.post(endpoint, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });

    if (resp.data?.errorcode !== 0) {
        throw new Error(`API error: ${resp.data?.msg || 'unknown'}`);
    }

    const data = resp.data.data;
    const list = data.oppHits || [];
    console.log("Total matching grants:", data.hitCount);
    console.log("Number of grants in this page:", list.length);

    const withAwards = list.filter(o => o.awardFloor || o.awardCeiling);
    console.log(`Grants with award data: ${withAwards.length} / ${list.length}`);
    if (withAwards[0]) console.log("Sample with awards:", JSON.stringify(withAwards[0], null, 2));

    return list.map(opp => ({
        id: opp.id,
        number: opp.number,
        title: opp.title,
        agency: opp.agencyName || opp.agencyCode || null,
        status: opp.oppStatus,
        postedDate: opp.openDate,
        closeDate: opp.closeDate,
        awardFloor: opp.awardFloor ?? null,
        awardCeiling: opp.awardCeiling ?? null,
        url: 'https://grants.gov/search-results-detail/' + opp.id,
    }));
}

scraper["mott.org"] = async (query, rows = 100) => {
    try {
        const searchUrl = `https://www.mott.org/grants/?location=Texas&query=${encodeURIComponent(query)}`;
        const results = await axios.get(searchUrl);

        const $ = cheerio.load(results.data);
        const pageCount = parseInt($('div.paging1 > ul > li:nth-last-of-type(2) > a').text());

        const grants = [];
        let page = 1;
        while (grants.length < rows && page <= pageCount) {
            const data = await axios.get(`${searchUrl}&pg=${page}`);
            const $ = cheerio.load(data.data);

            $('.card6').each((_, el) => {
                if (grants.length >= rows) return false;
                const title = $(el).find('a > span').text().trim();
                let url = $(el).find('a').attr('href');
                url = url.substring(0, url.length - 1);

                const opp = url.substring(url.lastIndexOf('/') + 1).replaceAll("-", "");
                const sponsor = $(el).find('div > p.card6-subtitle').text().trim();
                const amount = parseInt($(el).find('div > p.card6-amount').text().trim().replaceAll(",", "").substring(1));
                let postedDate = '';
                let closeDate = '';
                $(el).find('li').each((__, li) => {
                    if ($(li).text().includes('Grant Period')) {
                        const dates = $(li).find('span').text().trim().split('–');
                        postedDate = new Date(dates[0].trim());
                        closeDate = new Date(dates[1].trim());
                    }
                });

                grants.push({
                    number: `mott${opp}`,
                    title: title,
                    agency: sponsor,
                    amount: amount,
                    status: 'open',
                    postedDate: postedDate,
                    closeDate: closeDate,
                    url: url,
                });
            });
            page++;
        }
        return grants;
    } catch (e) {
        console.warn("Error fetching mott.org grants:", e);
    }
    return [];
}

export default scraper;
