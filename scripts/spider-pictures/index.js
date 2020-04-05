const axios = require("axios");
const cheerio = require("cheerio");

const amazon = async (url) => {
  const page = await getPage(url);
  const imageSrc = await getImageSrc(page);
  return imageSrc;
};

const getTitle = async (url) => {
  const page = await getPage(url);
  const $ = cheerio.load(page.res.data);
  var title;
  title = $("h1").first().text();
  // Amazon places the title in a span within the h1
  if (title === "") {
    title = $("h1").children().first().text();
  }
  if (title === "") return "Title was not found";
  return title.trim();
};

const getPage = async (url) => {
  try {
    return {
      res: await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36",
        },
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      res: await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36",
        },
      }),
    };
  }
};

const getImageSrc = async (page) => {
  let $ = cheerio.load(page.res.data);
  let imageSrcArr = [];
  $(".imgTagWrapper")
    .find("img")
    .each((index, item) => {
      let urls = item.attribs["data-a-dynamic-image"];
      if (urls != undefined) {
        for (let key in JSON.parse(urls)) {
          imageSrcArr.push(key);
        }
      }
    });

  // Try to look in another spot (Books)
  if (imageSrcArr.length <= 0) {
    let urls = $("#imgBlkFront").attr("data-a-dynamic-image");
    if (urls != undefined) {
      for (let key in JSON.parse(urls)) {
        imageSrcArr.push(key);
      }
    }
  }
  return imageSrcArr;
};

module.exports = {
  amazon,
  getTitle,
};
