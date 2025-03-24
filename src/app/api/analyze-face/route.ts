// app/api/analyze-face/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  RekognitionClient,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    // リクエストからJSONを取得
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { message: "画像データがありません" },
        { status: 400 }
      );
    }

    // Base64データを取り出す
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Rekognitionで顔分析
    const detectFacesResponse = await rekognition.send(
      new DetectFacesCommand({
        Image: {
          Bytes: buffer,
        },
        Attributes: ["ALL"], // すべての属性を取得
      })
    );

    // 顔が検出されなかった場合
    if (
      !detectFacesResponse.FaceDetails ||
      detectFacesResponse.FaceDetails.length === 0
    ) {
      return NextResponse.json({
        success: false,
        message: "顔が検出されませんでした",
      });
    }

    // 検出結果を返す
    return NextResponse.json({
      success: true,
      message: "顔分析に成功しました",
      faceCount: detectFacesResponse.FaceDetails.length,
      faceDetails: detectFacesResponse.FaceDetails.map((face) => ({
        age: {
          low: face.AgeRange?.Low,
          high: face.AgeRange?.High,
        },
        gender: face.Gender?.Value,
        genderConfidence: face.Gender?.Confidence,
        emotion: face.Emotions?.[0]?.Type, // 最も強い感情
        emotionConfidence: face.Emotions?.[0]?.Confidence,
        smile: face.Smile?.Value,
        eyeglasses: face.Eyeglasses?.Value,
        sunglasses: face.Sunglasses?.Value,
        beard: face.Beard?.Value,
        mustache: face.Mustache?.Value,
        eyesOpen: face.EyesOpen?.Value,
        mouthOpen: face.MouthOpen?.Value,
      })),
    });
  } catch (error) {
    console.error("エラー:", error);
    return NextResponse.json(
      { message: "エラーが発生しました", error: String(error) },
      { status: 500 }
    );
  }
}
