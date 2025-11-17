import { useEffect, useRef } from "react";

export default function WebCam() {
	const videoRef = useRef(null)

	useEffect(() => {
		async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
			])
		}

		loadModels()
		startWebcam()
	})

  return (
    <video 
		ref={videoRef}
		width={720} 
		height={560} 
		autoPlay 
		muted>
		</video>
  )
}