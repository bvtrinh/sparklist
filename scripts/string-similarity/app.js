const strCmp = require("./index");

async function test() {
  const item_title =
    "Apple MMEF2AM/A AirPods Wireless Bluetooth Headset for iPhones with iOS 10 or Later White";
  console.log(await strCmp.test(item_title));
}

test();
