const axios = require("axios");
const cheerio = require("cheerio");

const amazon = async url => {
  const page = await getPage(url);
  const imageSrc = await getImageSrc(page);
  return imageSrc;
};

const getPage = async url => {
  try {
    return { res: await axios.get(url) };
  } catch (err) {
    console.log(err);
    return { res: await axios.get(url) };
  }
};

const getImageSrc = async page => {
  let $ = cheerio.load(page.res.data);
  let imageSrcArr = [];
  $(".imgTagWrapper")
    .find("img")
    .each((index, item) => {
      const urls = item.attribs["data-a-dynamic-image"];
      if (urls != undefined) {
        for (let key in JSON.parse(urls)) {
          imageSrcArr.push(key);
        }
      }
    });
  return imageSrcArr;
};

module.exports = {
  amazon
};
