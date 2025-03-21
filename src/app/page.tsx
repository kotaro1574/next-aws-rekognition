"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
    }
  };

  const uploadToS3 = async () => {
    if (!image) return;

    try {
      setIsUploading(true);
      setUploadStatus("アップロード中...");

      // Base64データからBlobを作成
      const base64Data = image.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      // FormDataの作成
      const formData = new FormData();
      formData.append("file", blob, `image-${Date.now()}.jpg`);

      // API routeを使用してS3にアップロード
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("アップロードに失敗しました");
      }

      const result = await response.json();
      console.log(result);
      setUploadStatus(`アップロード成功: ${result.url}`);
    } catch (error) {
      console.error("アップロードエラー:", error);
      setUploadStatus(
        `エラー: ${
          error instanceof Error ? error.message : "アップロードに失敗しました"
        }`
      );
    } finally {
      setIsUploading(false);
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
        {image && (
          <button
            className="bg-green-500 hover:bg-green-600 cursor-pointer text-white px-4 py-1.5 rounded-md"
            onClick={uploadToS3}
            disabled={isUploading}
          >
            {isUploading ? "アップロード中..." : "S3にアップロード"}
          </button>
        )}
      </div>
      {image && (
        <div className="mt-4">
          <h3 className="mb-2 text-lg font-medium">撮影された写真</h3>
          <Image
            src={image}
            alt="撮影された写真"
            width={300}
            height={200}
            style={{
              objectFit: "contain",
              borderRadius: "12px",
            }}
          />
        </div>
      )}
      {uploadStatus && (
        <div
          className={`mt-2 p-2 rounded-md ${
            uploadStatus.includes("エラー")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
