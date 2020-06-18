// @ts-nocheck

import { ROIFeature } from "./processing.js";

const SCALE = 1.1;

export function loadXML() {
  // XML files from :
  //  * https://www.researchgate.net/publication/317013979_Face_Detection_on_Infrared_Thermal_Image
  //  * https://www.researchgate.net/publication/322601448_Algorithms_for_Face_Detection_on_Infrared_Thermal_Images
  fetch("/static/js/haareyes.xml").then(async function(response) {
    const buf = await response.arrayBuffer();
    let data = new Uint8Array(buf);
    cv.FS_createDataFile("/", "haareyes.xml", data, true, false, false);
  });
  fetch("/static/js/cascade_stg17.xml").then(async function(response) {
    const buf = await response.arrayBuffer();
    let data = new Uint8Array(buf);
    cv.FS_createDataFile("/", "cascade_stg17.xml", data, true, false, false);
  });

  fetch("/static/js/nonthermal.xml").then(async function(response) {
    const buf = await response.arrayBuffer();
    let data = new Uint8Array(buf);
    cv.FS_createDataFile("/", "nonthermal.xml", data, true, false, false);
  });
}

export function detect(
  smoothedData: Float32Array,
  width: number,
  height: number,
  colourFrame: any
): ROIFeature[] {
  let gray = cv.matFromArray(height, width, cv.CV_8UC1, colourFrame);
  // let gray = new cv.Mat();
  // floatMat.convertTo(gray, cv.CV_8UC1);
  let eyes = new cv.RectVector();

  let faces = new cv.RectVector();
  let faceCascade = new cv.CascadeClassifier();

  let eyeCascade = new cv.CascadeClassifier();
  // load pre-trained classifiers
  eyeCascade.load("haareyes.xml");
  faceCascade.load("nonthermal.xml");
  // detect faces
  faceCascade.detectMultiScale(
    gray,
    faces,
    SCALE,
    3,
    0,
    new cv.Size(0, 0),
    new cv.Size(height / 2, height / 2)
  );

  let results: ROIFeature = [];
  for (let i = 0; i < faces.size(); ++i) {
    console.log("colour found a face");
    let face = faces.get(i);

    let r = new ROIFeature();
    r.flavor = "Face";
    r.x0 = face.x;
    r.y0 = face.y;
    r.x1 = face.x + face.width;
    r.y1 = face.y + face.height;
    results.push(r);
    // detect eyes in face ROI
    let roiGray = gray.roi(face);

    eyeCascade.detectMultiScale(roiGray, eyes);
    for (let j = 0; j < eyes.size(); ++j) {
      let eye = eyes.get(i);
      console.log("found eyes", eye);
      let r = new ROIFeature();
      r.flavor = "eye";
      r.x0 = eye.x;
      r.y0 = eye.y;
      r.x1 = eye.x + eye.width;
      r.y1 = eye.y + eye.height;
      results.push(r);
    }
  }
  gray.delete();
  faceCascade.delete();
  faces.delete();
  return results;
}

export function detectThermal(
  smoothedData: Float32Array,
  width: number,
  height: number
): ROIFeature[] {
  // return null;
  let vMin = smoothedData[0];
  let vMax = smoothedData[0];
  for (let i = 0; i < smoothedData.length; i++) {
    vMin = Math.min(vMin, smoothedData[i]);
    vMax = Math.max(vMax, smoothedData[i]);
  }
  let testData = new Float32Array(smoothedData.length);
  for (let i = 0; i < smoothedData.length; i++) {
    testData[i] = (255 * (smoothedData[i] - vMin)) / (vMax - vMin);
  }
  let gray = cv.matFromArray(height, width, cv.CV_8UC1, testData);
  let faces = new cv.RectVector();
  let faceCascade = new cv.CascadeClassifier();
  faceCascade.load("cascade_stg17.xml");
  // detect faces
  faceCascade.detectMultiScale(
    gray,
    faces,
    SCALE,
    3,
    0,
    new cv.Size(0, 0),
    new cv.Size(height / 2, height / 2)
  );

  let results: ROIFeature = [];
  for (let i = 0; i < faces.size(); ++i) {
    console.log("thermal found a face");
    let face = faces.get(i);

    let r = new ROIFeature();
    r.flavor = "Face";
    r.x0 = face.x;
    r.y0 = face.y;
    r.x1 = face.x + face.width;
    r.y1 = face.y + face.height;
    results.push(r);
  }
  //  gray.delete();
  faceCascade.delete();
  faces.delete();
  return results;
}
