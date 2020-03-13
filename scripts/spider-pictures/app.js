const app = require("./index.js");

async function test() {
  const urls = await app.amazon(
    "https://www.amazon.ca/Eufy-BoostIQ-Super-Thin-Self-Charging-Medium-Pile/dp/B079QYYGF1?pf_rd_r=2F3PFW6P6F6DB8BWYT0P&pf_rd_p=71d5c146-52b1-46d7-887b-f7929473a113&pd_rd_r=5f0b1c0e-dcf5-4deb-8f7a-5efbcd6c9579&pd_rd_w=O9KCu&pd_rd_wg=zugfT&ref_=pd_gw_hl-stp-home"
  );
  console.log(urls[0]);
}

test();
