import axios from "axios";
import * as cheerio from "cheerio";

async function test() {
  const resp = await axios.get(
    "https://grants.gov/search-results-detail/361695",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );

  const $ = cheerio.load(resp.data);
  console.log($("body").text().replace(/\s+/g, " ").substring(0, 3000));
}

test().catch(console.error);
