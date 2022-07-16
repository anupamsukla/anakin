const myArgs = process.argv.slice(2);
var searchQuery = myArgs[0]
const puppeteer = require("puppeteer");
const fs = require("fs").promises;


(async () => {
    try {


        const browser = await puppeteer.launch({ headless: false }); // headless is a boolean that determines if the browser is visible or not
        const page = await browser.newPage(); // newPage is a function that creates a new page

        await page.setViewport({ width: 1200, height: 900 });
        await page.setDefaultNavigationTimeout(0);

        await page.goto(`https://food.grab.com/v1/autocomplete?component=country:SG&language=en&transportType=0&keyword=${searchQuery}&limit=10`, {
            waitUntil: "networkidle2",
        });
        const bodyHTML = await page.evaluate(() => JSON.parse(document.querySelector("body > pre").textContent));
        let querynumber = parseInt(Math.random() * 10)
        let query = bodyHTML?.places[querynumber]?.name
        console.log(query);

        await page.goto("https://food.grab.com/sg/en/", {
            // goto is a function that takes in a url and a set of options
            waitUntil: "networkidle2",
        });


        let location = query || "Singapore General Hospital - 1 Hospital Drive, Singapore, 169608";
        await page.type("#location-input", location); // type is a function that takes in an element and a string

        await page.click(
            // click is a function that takes in an element
            "#page-content > div.sectionContainer___3GDBD.searchSectionContainer___3Lhkk.ant-layout > div > button"
        ),
            await page.waitForNavigation({
                waitUntil: "networkidle2",
            });

        let data = new Array();
        page.on("response", async (response) => {
            try {
                const url = response.url();
                if (
                    url.includes(
                        "https://portal.grab.com/foodweb/v2/search" ||
                        "https://portal.grab.com/foodweb/v2/category"
                    )
                ) {
                    const firstResponse = await page.waitForResponse(url);

                    const jsonResponse = await firstResponse.json();
                    const restaurentsData = jsonResponse.searchResult.searchMerchants;
                    restaurentsData.forEach((e) => {
                        let obj = {
                            name: e.address.name,
                            latitude: e.latlng.latitude,
                            longitude: e.latlng.longitude,
                        };
                        data.push(obj);
                    });
                    page
                        .$(
                            "#page-content > div:nth-child(4) > div > div > div:nth-child(5) > div > button"
                        )
                        .then(async (button) => {

                            if (button) {
                                await button.click();
                                await page.waitForNavigation({
                                    waitUntil: "networkidle2",
                                });
                                await page.waitFor(5000);
                            }
                        });
                    await fs.writeFile("data.json", JSON.stringify(data));
                    // console.log("Data saved successfully");
                }
            } catch (error) {
                console.log(error);

            }
        });
    } catch (error) {
        console.log(error);
    }
})();