import grantScraper from './grantScraper.js';
import axios from 'axios';


let grants = await grantScraper["txsmartbuy.gov"]("");

console.log(grants);