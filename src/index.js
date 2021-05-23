require("@tensorflow/tfjs-backend-cpu");
require("@tensorflow/tfjs-backend-webgl");
import { version } from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const status = document.getElementById("status");

if (status) {
  status.innerText = "Loaded TensorFlow.js - version: " + version.tfjs;
}

// Obtain reference to key document elements
const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");

// Check webcam support
const getUserMediaSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Load ML model asynchronously
const loadModel = async () => {
  try {
    const model = await cocoSsd.load();
    return model;
  } catch (error) {
    console.warn("Error loading model: ", error);
  }
};

// Add event listener to react to user click event
if (getUserMediaSupport()) {
  // Create a variable to track the asynchronously loaded ML model
  let model = undefined;

  console.log("Loading model");
  // Load the ML model asynchronously, which dependent on type might be quite large
  loadModel().then((result) => {
    model = result;
    // Show demo section now model is ready to use.
    demosSection.classList.remove("invisible");
  });

  let children = [];
  const predictWebcam = async () => {
    // TODO: Add prediction handler function
    try {
      const predictions = await model.detect(video);
      // Remove highlighting from previous frame
      for (let i = 0; i < children.length; i++) {
        liveView.removeChild(children[i]);
      }
      children.splice(0);

      // Loop through predictions and render the bounding box in the HTML document
      for (let prediction of predictions) {
        const { bbox } = prediction;
        const [x, y, width, height] = bbox;
        // render only predictions with a confidence over 66%
        if (prediction.score > 0.66) {
          const p = document.createElement("p");
          p.innerText =
            prediction.class +
            " – with " +
            Math.round(parseFloat(prediction.score) * 100) +
            "% confidence.";

          p.style =
            "margin-left: " +
            x +
            "px; margin-top: " +
            (y - 10) +
            "px; width " +
            (width - 10) +
            "px; top: 0; left: 0;";

          const highlighter = document.createElement("div");
          highlighter.setAttribute("class", "highlighter");
          highlighter.style =
            "left: " +
            x +
            "px; top: " +
            y +
            "px; width: " +
            width +
            "px; height: " +
            height +
            "px;";

          liveView.appendChild(highlighter);
          liveView.appendChild(p);
          children.push(highlighter);
          children.push(p);
        }
      }

      // Repeat on next frame.
      window.requestAnimationFrame(predictWebcam);
    } catch (error) {
      console.error("predictWebcam::Error encountered – ", error);
    }
  };

  enableWebcamButton.addEventListener("click", (event) => {
    if (!model) {
      return;
    }

    // Hide the button once clicked
    event.target.classList.add("removed");

    // Only request the video capability
    const constraints = {
      video: true,
    };

    // Activate the webcam stream
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });
  });
} else {
  console.warn("getUserMedia() is not supported by your current browser");
}
