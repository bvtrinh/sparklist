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
      const url = item.attribs["data-old-hires"];
      if (url != undefined) imageSrcArr.push(url);
    });
  return imageSrcArr;
};

module.exports = {
  amazon
};
