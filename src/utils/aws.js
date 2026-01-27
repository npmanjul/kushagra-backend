import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const awsPresignedUploadUrls = async (files) => {
  return Promise.all(
    files.map(async ({ fileType }) => {
      const ext = fileType.split("/")[1];
      const key = `images/${crypto.randomUUID()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 600,
      });

      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return { uploadUrl, publicUrl, key };
    }),
  );
};
