import { NextApiRequest, NextApiResponse } from "next";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if ( req.method !== "POST") {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  if(req.headers.authorization !== process.env.SERVICE_KEY){
    res.status(404).end(); // Forbidden
    return;
  }

  try {
    const { bucketName, fileName } = req.query;
    if (!bucketName || !fileName) {
      res.status(400).json({ error: "Bucket name and file name are required." });
      return;
    }

   
      // Presign PUT request (Write access)
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName as string,
        Key: fileName as string,
      });

      const expiresIn = 3600; // Link expiration time in seconds (1 hour in this example)
      const signedUrl = await getSignedUrl(S3, putObjectCommand, { expiresIn });
      res.status(200).json({ url: signedUrl });
    
  } catch (error) {
    console.error("Error presigning URL:", error);
    res.status(500).json({ error: "Error presigning URL" });
  }
}