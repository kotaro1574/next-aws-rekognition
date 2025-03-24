import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルがアップロードされていません" },
        { status: 400 }
      );
    }

    // S3クライアントの設定
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    // ファイル名の設定
    const fileName = `uploads/${Date.now()}-${file.name}`;

    // ファイルのバイナリデータを取得
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // S3のURL生成
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "ap-northeast-1"
    }.amazonaws.com/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
    });
  } catch (error) {
    console.error("S3アップロードエラー:", error);
    return NextResponse.json(
      { error: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
