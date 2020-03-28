const axios = require("axios");
const cheerio = require("cheerio");

const amazon = async url => {
  const page = await getPage(url);
  const imageSrc = await getImageSrc(page);
  return imageSrc;
};

const getTitle = async url => {
  const page = await getPage(url);
  const $ = cheerio.load(page.res.data);
  var title;
  title = $("h1")
    .first()
    .text();
  // Amazon places the title in a span within the h1
  if (title === "") {
    title = $("h1")
      .children()
      .first()
      .text();
  }
  if (title === "") return "Title was not found";
  return title.trim();
};

const getPage = async url => {
  try {
    return { res: await axios.get(url) };
  } catch (err) {
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
  amazon,
  getTitle
};
