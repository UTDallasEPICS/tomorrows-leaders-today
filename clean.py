import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def main():
    # Headless browser
    browser_conf = BrowserConfig(headless=True)

    # JavaScript-based wait condition: wait until the table exists
    wait_condition = """() => {
        const table = document.querySelector(
            ".usa-table"
        );
        return table !== null;
    }"""

    # Crawl configuration using JS wait (no timeout specified)
    run_conf = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_for=f"js:{wait_condition}"
    )

    async with AsyncWebCrawler(config=browser_conf) as crawler:
        result = await crawler.arun(
            url="https://simpler.grants.gov/search?query=leadership+training",
            css_selector=".usa-table.usa-table--borderless.simpler-responsive-table.width-full.tablet-lg\\:width-auto.border-base.tablet-lg\\:border-0",  # extract the full table
            config=run_conf
        )

        # Print the table content as Markdown
        print(result.markdown)

        # Optional: access raw HTML for custom parsing
        # print(result.extracted_content[0])

if __name__ == "__main__":
    asyncio.run(main())