const multer = require("multer");

exports.uploadImg = (image, pass) => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, "uploads/img");
    },
    filename: (_req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, ""));
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(png|PNG|jpeg|jpg|JPG|JPEG)$/)) {
      req.fileValidationError = {
        message: "only image file are allowed!",
      };
      return cb(new Error("only image file are allowed!"), false);
    }
    cb(null, true);
  };

  const sizeMb = 2;
  const maxSize = sizeMb * 1000 * 1000; //

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  }).single(image);

  return (req, res, next) => {
    upload(req, res, function (err) {
      if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError);
      }

      if (!req.file && !err) {
        if (pass) return next();
        return res.status(400).send({
          message: "please select the file",
        });
      }

      if (err && err.code == "LIMIT_FILE_SIZE") {
        return res.status(400).send({
          message: "Max file 10MB",
        });
      }

      return next();
    });
  };
};
