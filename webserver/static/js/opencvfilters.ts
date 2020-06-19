// @ts-nocheck
import { BlobReader } from "./utils.js";

let templatePoints = [];
// let template = null;
export function loadTemplates() {
  let template = cv.imread("template");
  cv.normalize(template, template, 0, 255, cv.NORM_MINMAX);
  template.convertTo(template, cv.CV_8UC1);
  cv.threshold(template, template, 0, 255, cv.THRESH_BINARY & cv.THRESH_OTSU);
  templatePoints = [];
  for (let y = 0; y < template.rows; y++) {
    for (let x = 0; x < template.cols; x++) {
      if (template.ucharPtr(y, x)[0] == 255) {
        templatePoints.push([x, y]);
      }
    }
  }
  console.log(templatePoints);
  // XML files from :
  //  * https://www.researchgate.net/publication/317013979_Face_Detection_on_Infrared_Thermal_Image
  //  * https://www.researchgate.net/publication/322601448_Algorithms_for_Face_Detection_on_Infrared_Thermal_Images
  // fetch("/static/template.png").then(async function(response) {
  //   const blob = await response.blob();
  //   console.log(blob);
  //   const data = await BlobReader.arrayBuffer(blob);
  //   template = new Uint8Array(data);
  //   console.log(data);
  //   // cv.FS_createDataFile("/", "template.png", data, true, false, false);
  // });
}

export function otsus(
  data: Float32Array,
  height: number,
  width: number,
  overlayCtx: any,
  scaleX: number,
  scaleY: number
) {
  let gray = cv.matFromArray(height, width, cv.CV_32FC1, data);
  cv.normalize(gray, gray, 0, 255, cv.NORM_MINMAX);
  gray.convertTo(gray, cv.CV_8UC1);

  cv.threshold(gray, gray, 128, 255, cv.THRESH_BINARY & cv.THRESH_OTSU);

  // Applying Blur effect on the Image
  // cv.morphologyEx(gray, gray, cv.MORPH_OPEN, kernel);
  // console.log(gray);
  // cv.Canny(gray, gray, 50, 300);
  let kernel = new cv.Mat.ones(3, 3, cv.CV_8U);

  let opening = new cv.Mat();
  let distTrans = new cv.Mat();
  cv.erode(gray, gray, kernel);
  cv.dilate(gray, opening, kernel);
  // distance transform
  cv.distanceTransform(opening, distTrans, cv.DIST_L2, 5);
  cv.normalize(distTrans, distTrans, 1, 0, cv.NORM_INF);

  const templateHeight = 0;
  const templateWidth = 0;
  console.log(distTrans);
  let maxScore = 0;
  let points = [0, 0];
  for (let y = 0; y < height - templateHeight; y++) {
    for (let x = 0; x < width - templateWidth; x++) {
      let score = calcScore(template, distTrans, x, y, width, height);
      if (score > maxScore) {
        maxScore = score;
        points = [x, y];
        // console.log("score at ", x, y, " is ", score);
      }
    }
  }
  overlayCtx.beginPath();
  overlayCtx.strokeStyle = "#ffff00";
  overlayCtx.rect(
    points[0] * scaleX,
    points[1] * scaleY,
    template.cols * scaleX,
    template.rows * scaleY
  );
  overlayCtx.stroke();
  // let templateMat = cv.matFromArray(100, 84, cv.CV_8UC4, template);
  // templateMat.convertTo(templateMat, cv.CV_8UC1);
  cv.imshow("main_canvas", distTrans);
  throw "Exepct";
  return gray.data;
  // cv.imshow("main_canvas", gray);
  // throw "ERROR";
  // return null;
  // return gray.data;
}

function calcScore(template, data, dX, dY, width, height) {
  let score = 0;
  for (let point of templatePoints) {
    let y = point[1];
    let x = point[0];
    if (dY + y >= height) {
      break;
    }
    if (dX + x >= width) {
      continue;
    }
    score += data.ucharPtr(y + dY, dX + x)[0]; //[(y + dY) * width + dX + x];
  }
  // for (let y = 0; y < template.rows; y++) {
  //   for (let x = 0; x < template.cols; x++) {
  //     score += data.ucharPtr(y + dY, dX + x)[0]; //[(y + dY) * width + dX + x];
  //   }
  // }
  return score;
}
