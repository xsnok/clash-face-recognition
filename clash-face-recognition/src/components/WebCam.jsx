import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function WebCam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = useState("");

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            detectFaces();
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    async function loadModels() {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      startWebcam();
    }

    async function detectFaces() {
      setInterval(async () => {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        canvasRef.current.innerHTML = "";
        canvasRef.current.appendChild(canvas);

        const displaySize = {
          width: 720,
          height: 560,
        };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        canvas.getContext("2d").clearRect(0, 0, 720, 560);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvasRef &&
          canvasRef.current &&
          canvasRef.current
            .getContext("2d")
            .clearRect(0, 0, canvas.width, canvas.height);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceExpressions(
            canvasRef.current,
            resizedDetections
          );
        try {
          findBestEmotion(detections[0].expressions);
        } catch {
          console.log("Nobody detected on screen");
        }
      }, 100);
    }

    function findBestEmotion(expressions) {
      let bestEmotion = null;
      let score = 0;

      for (const emotion in expressions) {
        if (expressions[emotion] > score) {
          score = expressions[emotion];
          bestEmotion = emotion;
        }
      }

      setCurrentEmotion(bestEmotion);
      console.log(`${bestEmotion}: ${score}`);
    }

    loadModels();
  }, []);

  return (
    <>
      <div style={{ position: "relative", width: 720, height: 560 }}>
        <video
          ref={videoRef}
          width={720}
          height={560}
          autoPlay
          muted
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <canvas
          ref={canvasRef}
          width={720}
          height={560}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>
      <div>{}</div>
    </>
  );
}
