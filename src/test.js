import scraper from "./library/grantScraper.js";

const grants = scraper["txsmartbuy.gov"](300);
console.log(grants);