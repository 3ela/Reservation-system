const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `uploads/images`)
  },
  filename: function (req, file, cb) {
    //* get current extension
    let originalname = file.originalname.split('.');
    let ext = originalname[originalname.length - 1];

    //* make a unique suffix to upload on the server
    const uniqueSuffix = Date.now();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
  }
});

const imagePath = multer({ storage: storage })

const uploadObj = {
  amenityUpload: imagePath.single('icon')
}

module.exports = uploadObj;