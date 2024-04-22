import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('testing... 1');

    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    console.log('testing... 2');
    cb(null, file.originalname);
  }
});

export const upload = multer({
  storage
}).single('photo');
