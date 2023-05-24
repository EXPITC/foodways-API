// helper to extract cloudinary publicId from url base
exports.getPublicId = (url) => {
  const arr = url.split("/");
  const publicId = arr[arr.length - 2] + "/" + arr.slice(-1)[0].split(".")[0];

  return publicId;
};
