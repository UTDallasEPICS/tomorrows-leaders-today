import axios from 'axios';
import * as cheerio from 'cheerio' 
console.log("timo");

try {
  // Load page
    const results = await axios.get('https://simpler.grants.gov/search?utm_source=Grants.gov&query=leadership+training');
    
    const $ = cheerio.load(results.data);

    // Get current timestamp
    const timeOfCreation = new Date().toISOString();

    // Select all <tr> rows with the class you mentioned
    const rows = $("tr.border-base.border-x.border-y.tablet-lg\\:border-0");

    const opportunities = [];

    rows.each((i, row) => {
    const cells = $(row).find("td").map((j, cell) => $(cell).text().trim()).get();

    const clean = (text, prefix) => text ? text.replace(prefix, "").trim() : null;

    // Split title and number
    let titleText = clean(cells[2], "Title") || cells[2];
    let titleMatch = titleText.match(/(.*?)(Number:\s*(.*))?$/);
    let title = titleMatch ? titleMatch[1].trim() : titleText;
    let number = titleMatch && titleMatch[3] ? titleMatch[3].trim() : null;

    // Split agency and posted date, remove "Expected awards"
    let agencyText = clean(cells[3], "Agency") || cells[3];
    let agencyMatch = agencyText.match(/(.*)Posted date:\s*([^\n]*)/);
    let agency = agencyMatch ? agencyMatch[1].trim() : agencyText;
    let posted_date = agencyMatch ? agencyMatch[2].trim().replace(/Expected awards:.*/i, '').trim() : null;

    const opportunity = {
      time_of_creation: timeOfCreation,
      last_updated: timeOfCreation,
      close: clean(cells[0], "Close date") || clean(cells[0], "Close dateTBD"),
      status: clean(cells[1], "Status") || cells[1],
      title: title,
      number: number,
      agency: agency,
      posted_date: posted_date,
      award_min: clean(cells[4], "Award min") || cells[4],
      award_max: clean(cells[5], "Award max") || cells[5]
    };

    opportunities.push(opportunity);
  });

  console.log(JSON.stringify(opportunities, null, 2));


} catch (e) {
  console.warn('Cannot find any info from this URL. Maybe try a different one.');
}