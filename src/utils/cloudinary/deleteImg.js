const { getPublicId } = require("./getPublicId");

exports.deleteImg = async (url) => {
  // req.uploadImg.url
  const publicId = getPublicId(url);
  await cloudinary.uploader.destroy(publicId);
};
