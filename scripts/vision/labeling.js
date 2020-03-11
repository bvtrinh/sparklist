const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

module.exports = async function(image_url) {
    const [result] = await client.labelDetection(image_url);
    const labels = result.labelAnnotations;
    // console.log('labels:');
    var ary = [];
    // labels.forEach(label => console.log(label.description));
    labels.forEach(label => {
      // console.log(label.description);
      ary.push(label.description);

    });

    // console.log(ary);

    return ary;
    

}