"use client";

import { FaceDetail } from "@aws-sdk/client-rekognition";
import Image from "next/image";
import { useRef, useState } from "react";
import Webcam from "react-webcam";

interface FaceAnalysisResult {
  success: boolean;
  message: string;
  faceCount?: number;
  faceDetails?: FaceDetail[];
}

// 感情の英語名から日本語への変換関数
const translateEmotion = (emotion?: string): string => {
  if (!emotion) return "不明 ❓";

  const emotionMap: Record<string, string> = {
    HAPPY: "喜び 😄",
    SAD: "悲しみ 😢",
    ANGRY: "怒り 😠",
    CONFUSED: "困惑 😕",
    DISGUSTED: "嫌悪 🤢",
    SURPRISED: "驚き 😲",
    CALM: "平静 😌",
    FEAR: "恐怖 😱",
    UNKNOWN: "不明 ❓",
  };

  return emotionMap[emotion] || `${emotion} ❓`;
};

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [faceAnalysisResult, setFaceAnalysisResult] =
    useState<FaceAnalysisResult | null>(null);

  const analyzeImage = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);

      try {
        setIsAnalyzing(true);

        const response = await fetch("/api/analyze-face", {
          method: "POST",
          body: JSON.stringify({ imageData: imageSrc }),
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        setFaceAnalysisResult(result);
      } catch (error) {
        console.error("分析エラー:", error);
        setFaceAnalysisResult({
          success: false,
          message: "エラーが発生しました",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="max-w-100 mx-auto p-4 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">顔分析</h1>

      <Webcam
        className="rounded-lg"
        ref={webcamRef}
        screenshotFormat="image/jpeg"
      />

      <button
        className="w-full bg-green-500 hover:bg-green-600 cursor-pointer text-white px-4 py-1.5 rounded-md"
        onClick={analyzeImage}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? "分析中..." : "顔を分析する"}
      </button>

      {image && (
        <div>
          <h3 className="mb-2 text-lg font-medium">撮影された写真</h3>
          <Image
            src={image}
            alt="撮影された写真"
            width={300}
            height={200}
            className="rounded-lg"
          />
        </div>
      )}
      {faceAnalysisResult && (
        <div className="p-4 bg-gray-100 rounded-lg text-black">
          <h3 className="text-lg font-semibold mb-2">分析結果</h3>
          {faceAnalysisResult.success ? (
            <div>
              <p>検出された顔: {faceAnalysisResult.faceCount}個 👤</p>
              {faceAnalysisResult.faceDetails?.map((face, index) => (
                <div
                  key={index}
                  className="mt-3 p-3 bg-white rounded shadow-sm"
                >
                  <p>
                    年齢: 約{face.AgeRange?.Low}～{face.AgeRange?.High}歳
                  </p>
                  <p>
                    性別:{" "}
                    {face.Gender?.Value === "Male" ? "男性 👨" : "女性 👩"} (
                    {Math.round(face.Gender?.Confidence ?? 0)}%)
                  </p>
                  <p>
                    感情: {translateEmotion(face.Emotions?.[0]?.Type)} (
                    {Math.round(face.Emotions?.[0]?.Confidence ?? 0)}%)
                  </p>
                  <p>笑顔: {face.Smile?.Value ? "あり 😊" : "なし 😐"}</p>
                  <p>
                    眼鏡: {face.Eyeglasses?.Value ? "着用 👓" : "未着用 👀"}
                  </p>
                  <p>
                    サングラス:{" "}
                    {face.Sunglasses?.Value ? "着用 🕶️" : "未着用 👀"}
                  </p>
                  <p>ひげ: {face.Beard?.Value ? "あり 🧔" : "なし 🙂"}</p>
                  <p>口髭: {face.Mustache?.Value ? "あり 👨" : "なし 🙂"}</p>
                  <p>
                    目が開いている:{" "}
                    {face.EyesOpen?.Value ? "開いている 👀" : "閉じている 😌"}
                  </p>
                  <p>
                    口が開いている:{" "}
                    {face.MouthOpen?.Value ? "開いている 😮" : "閉じている 😶"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>{faceAnalysisResult.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
