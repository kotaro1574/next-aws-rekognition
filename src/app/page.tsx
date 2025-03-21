"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      console.log(imageSrc);
      // 画像データの処理（保存、表示など）
    }
  };
  return (
    <div className="max-w-100 mx-auto p-4 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">顔認証</h1>

      <Webcam
        className="rounded-lg"
        ref={webcamRef}
        videoConstraints={{ facingMode }}
        screenshotFormat="image/jpeg"
      />
      <div className="flex flex-col gap-4 w-full">
        <button
          className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-1.5 rounded-md"
          onClick={capture}
        >
          撮る
        </button>
        <button
          className="bg-gray-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-1.5 rounded-md"
          onClick={switchCamera}
        >
          切り替え
        </button>
      </div>
    </div>
  );
}
