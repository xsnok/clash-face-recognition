import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Loading from "./Loading";
import angry from "../assets/angry.png";
import disgusted from "../assets/disgusted.png";
import fearful from "../assets/fearful.png";
import happy from "../assets/happy.png";
import neutral from "../assets/neutral.png";
import sad from "../assets/sad.png";
import surprised from "../assets/surprised.png";

export default function WebCam() {
  const videoRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState("");

  const images = { angry, disgusted, fearful, happy, neutral, sad, surprised };

  useEffect(() => {
    let rafId = null;
    let detectionRunning = true;

    async function loadModels() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
    }

    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((res) => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              res();
            };
          });
          setLoading(false);
          setupCanvas();
          startDetectionLoop();
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    function setupCanvas() {
      if (!canvasRef.current) {
        const c = faceapi.createCanvasFromMedia(videoRef.current);
        c.style.position = "absolute";
        c.style.top = "0";
        c.style.left = "0";
        c.className = "w-full h-full rounded-md";
        canvasRef.current = c;
      }

      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = "";
        canvasContainerRef.current.appendChild(canvasRef.current);
      }

      const displaySize = {
        width: videoRef.current.videoWidth || 720,
        height: videoRef.current.videoHeight || 560,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);
    }

    function findBestEmotion(expressions) {
      if (!expressions) return;
      let bestEmotion = null;
      let score = 0;
      for (const emotion in expressions) {
        if (expressions[emotion] > score) {
          score = expressions[emotion];
          bestEmotion = emotion;
        }
      }
      setCurrentEmotion(bestEmotion);
    }

    async function detectFrame() {
      if (!detectionRunning) return;
      if (
        !videoRef.current ||
        videoRef.current.readyState !== 4 ||
        !canvasRef.current
      ) {
        rafId = requestAnimationFrame(detectFrame);
        return;
      }

      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      const resized = faceapi.resizeResults(detections, displaySize);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

      if (detections && detections[0] && detections[0].expressions) {
        findBestEmotion(detections[0].expressions);
      } else {
        setCurrentEmotion("");
      }

      rafId = requestAnimationFrame(detectFrame);
    }

    function startDetectionLoop() {
      if (!canvasRef.current) setupCanvas();
      detectionRunning = true;
      rafId = requestAnimationFrame(detectFrame);
    }

    async function init() {
      await loadModels();
      await startWebcam();
    }
    init();

    return () => {
      detectionRunning = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full text-white gap-6">
      <h1 className="text-3xl font-bold mb-2">Clash Emote Detector</h1>

      <div className="bg-[#2d4f80] w-full max-w-[900px] rounded-xl p-6 flex flex-col items-center gap-6">
        {loading && <Loading />}

        <div className="h-40 flex items-center justify-center">
          {currentEmotion && (
            <img
              src={images[currentEmotion]}
              className="h-40 object-contain"
              alt="emotion"
            />
          )}
        </div>

        <div className="relative w-full max-w-[500px] aspect-video mx-auto">
          <video
            ref={videoRef}
            className="transform scale-x-[-1] absolute top-0 left-0 w-full h-full object-cover rounded-md shadow-md"
            autoPlay
            muted
          />
          <div
            ref={canvasContainerRef}
            className="absolute top-0 left-0 w-full h-full rounded-md overflow-hidden transform scale-x-[-1]"
          />
        </div>
      </div>
    </div>
  );
}
