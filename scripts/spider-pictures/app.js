const app = require("./index.js");

async function test() {
  const urls = await app.amazon(
    "https://www.amazon.ca/Subtle-Art-Not-Giving-Counterintuitive/dp/0062641549?ref_=Oct_TopRatedC_916520_3&pf_rd_r=7AG37VTD9F0D2ND4H9RP&pf_rd_p=6c478dbf-4b91-52d8-8eb2-d2598ba547c0&pf_rd_s=merchandised-search-11&pf_rd_t=101&pf_rd_i=916520&pf_rd_m=A3DWYIK6Y9EEQB"
  );
  console.log(urls[0]);
}

test();
