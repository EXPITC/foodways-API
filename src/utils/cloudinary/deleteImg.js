const { getPublicId } = require("./getPublicId");
const { cloudinary } = require("./couldinary");

exports.deleteImg = async (url) => {
  // req.uploadImg.url
  const publicId = getPublicId(url);
  await cloudinary.uploader.destroy(publicId);
};
