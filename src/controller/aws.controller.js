import { awsPresignedUploadUrls } from "../utils/aws.js";

const getPresignedUploadUrls = async (req, res) => {
  const { files } = req.body;

  if (!Array.isArray(files) || files.length === 0)
    return res.status(400).json({
      success: false,
      message: "Files array is required",
    });

  for (const file of files)
    if (!file.fileType?.startsWith("image/"))
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only images are allowed.",
      });

  const presignedUploadUrls = await awsPresignedUploadUrls(files);

  return res.json({
    success: true,
    message: "Upload URLs fetched successfully.",
    data: presignedUploadUrls,
  });
};

export default { getPresignedUploadUrls };