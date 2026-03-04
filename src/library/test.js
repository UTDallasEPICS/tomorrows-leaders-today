import grantScraper from './grantScraper.js';
import axios from 'axios';

//grantScraper["txsmartbuy.gov"]("leadership")
let query = "leadership";
const searchUrl = `https://www.txsmartbuy.gov/esbd-grants?&keyword=${encodeURIComponent(query)}`;
const results = await axios.get(searchUrl);
/*
console.log("hello");
*/
