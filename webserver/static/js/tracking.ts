import { ROIFeature, FeatureState } from "./processing.js";
const sizeDelta = 5;
const centerMaxDelta = 5;
const maxFrameSkip = 5;
let FaceID = 0;
class Face {
  roi: ROIFeature;
  forehead: ROIFeature;
  frame: number;
  id: number;
  contructor(roi: ROIFeature){
    this.roi = roi;
    this.id= FaceID;
    FaceID++;

  }

  stillCurrent(currentFrame:number): boolean{
    return this.framesSince(currentFrame) <=maxFrameSkip;
  }

  framesSince(currentFrame:number): number{
    return currentFrame - this.frame;
  }
  compare(other:ROIFeature){
    const deltaX = this.roi.midX() - other.midX()
    const deltaY = this.roi.midY() - other.midY()

    const deltaWidth = this.roi.width() - other.width()
    const deltaHeight  = this.roi.height() - other.height()

    return this.roi.overlap(other.x0,other.y0,other.x1,other.y1) && deltaX+deltaY < 2*centerMaxDelta && deltaWidth + deltaHeight < 2*sizeDelta;
    // let centerError;
    // if(deltaX + deltaY <2*centerMaxDelta ){
    //   centerError =0;
    // }else{
    //   centerError = deltaX+ deltaY;
    // }
    //
    // let sizeError;
    // if(deltaWidth <  sizeDelta){
    //   sizeError = 0;
    // }

  }
}

function trackFaces(frame:number, faces:Face[], frameROI:ROIFeature[]){
  faces = faces.filter(face => face.stillCurrent(frame));
  for( const face of faces){
    let index=-1;
    for(let i = 0;  i< frameROI.length; i++){
      if(face.compare(frameROI[i])){
        index =i
        face.frame = frame
        break;
      }
    }
    if(index !=-1){
      frameROI.splice(index,1)
    }
  }

}
