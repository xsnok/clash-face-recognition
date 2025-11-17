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