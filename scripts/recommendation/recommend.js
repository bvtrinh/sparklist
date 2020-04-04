const recom = require("./index.js");

async function test() {
  try {
    // recom.getRecom("5e6ae55ca302da6cb807a901");
    recom.deleteItem("5e87d6aa6d385c7448fc29bc");
  } catch (err) {
    console.log(err);
  }
}

test();
