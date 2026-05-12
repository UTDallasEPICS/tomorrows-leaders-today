export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h).toString(16).padStart(8, '0').substring(0, 8);
}

export function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...options.headers,
        },
        data: options.data,
        timeout: 30000,
      });
      return response;
    } catch (error) {
      if (i < retries - 1) await delay(2000 * (i + 1));
    }
  }
  return null;
}

export const KEYWORDS = [
  "youth workforce",
  "workforce development",
  "workforce",
  "youth development",
  "leadership",
  "veteran",
  "veterans",
  "military",
  "Youth",
  "youth",
  "Young",
  "young",
  "Children",
  "Minors",
  "minors",
  "Education",
  "education",
  "Foster youth",
  "foster",
  "Wounded warriors",
  "Disabled veterans",
  "disabled",
  "Housing",
  "housing",
  "Elderly",
  "elderly",
  "Leader",
  "leader",
  "Leadership",
  "Community leadership",
  "Executive training",
  "executive",
  "Professional development",
  "professional",
  "Development",
  "development",
  "Texas",
  "Southern Region",
  "West South Central Division",
  "Gulf States",
];

export const ANTI_KEYWORDS = [
  "early childhood",
  "preschool",
  "pre-school",
  "special needs",
  "physical therapy",
  "animal",
  "wildlife",
  "environmental",
  "climate",
  "agriculture",
  "arts endowment",
];