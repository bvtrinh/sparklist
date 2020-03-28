const app = require("./index.js");

async function test() {
  // const url =
  //   "https://www.amazon.ca/Eufy-BoostIQ-Super-Thin-Self-Charging-Medium-Pile/dp/B079QYYGF1?pf_rd_r=2F3PFW6P6F6DB8BWYT0P&pf_rd_p=71d5c146-52b1-46d7-887b-f7929473a113&pd_rd_r=5f0b1c0e-dcf5-4deb-8f7a-5efbcd6c9579&pd_rd_w=O9KCu&pd_rd_wg=zugfT&ref_=pd_gw_hl-stp-home";
  // const urls = await app.amazon(url);
  // console.log(urls[0]);
  const url_links = [
    "https://www.amazon.ca/Eufy-BoostIQ-Super-Thin-Self-Charging-Medium-Pile/dp/B079QYYGF1?pf_rd_r=2F3PFW6P6F6DB8BWYT0P&pf_rd_p=71d5c146-52b1-46d7-887b-f7929473a113&pd_rd_r=5f0b1c0e-dcf5-4deb-8f7a-5efbcd6c9579&pd_rd_w=O9KCu&pd_rd_wg=zugfT&ref_=pd_gw_hl-stp-home",
    "https://www2.hm.com/en_ca/productpage.0763988006.html",
    "https://www.bestbuy.ca/en-ca/product/apple-ipad-air-10-5-256gb-with-wi-fi-4g-lte-3rd-generation-silver/13487356",
    "https://www.walmart.ca/en/ip/little-tikes-turtle-sandbox/6000192091282?rrid=richrelevance",
    "https://www.adidas.ca/en/ultraboost-20-shoes/EG0692.html",
    "https://www.ebgames.ca/PS4/Games/774516/the-last-of-us-part-ii"
  ];

  url_links.forEach(async link => {
    console.log(await app.getTitle(link));
  });
}

test();
