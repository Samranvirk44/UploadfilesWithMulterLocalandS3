var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path')
const fs = require("fs")

AWS.config.update({
  accessKeyId: "Your access ky",
  secretAccessKey: "Your Secret key",
  region: "us-east-2"
});

// CREATE OBJECT FOR S3
const s3 = new AWS.S3();


var multerS3 = require('multer-s3')

var upload = multer({
  // CREATE MULTER-S3 FUNCTION FOR STORAGE
  storage: multerS3({
      s3: s3,
      // bucket - WE CAN PASS SUB FOLDER NAME ALSO LIKE 'bucket-name/sub-folder1'
      bucket: 'bucketname',
      // META DATA FOR PUTTING FIELD NAME
      metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
      },
      // SET / MODIFY ORIGINAL FILE NAME
      key: function (req, file, cb) {
          cb(null, file.originalname); //set unique file name if you wise using Date.toISOString()
          // EXAMPLE 1
          // cb(null, Date.now() + '-' + file.originalname);
          // EXAMPLE 2
          // cb(null, new Date().toISOString() + '-' + file.originalname);

      }
  }),
  // SET DEFAULT FILE SIZE UPLOAD LIMIT
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
  // FILTER OPTIONS LIKE VALIDATING FILE EXTENSION
  fileFilter: function(req, file, cb) {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype && extname) {
          return cb(null, true);
      } else {
          cb("Error: Allow images only of extensions jpeg|jpg|png !");
      }
  }
});






var storage1 = multer.diskStorage({
  // Setting directory on disk to save uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },

  // Setting name of file saved
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + ".jpeg"
    );
  },
});

const upload1 = multer({
  storage: storage1,
  limits: {
    // Setting Image Size Limit to 2MBs
    fileSize: 100 * 1000000,
  },
  fileFilter(req, file, cb) {
    // if (!file.originalname.match(/\.(jpg|jpeg|png|mp4)$/)) {
    //     //Error
    //     cb(new Error('Please upload JPG,PNG or MP3 files only!'))
    // }
    //Success
    cb(undefined, true);
  },
})
const storage = multerS3({
  s3: s3,
  bucket: 'bucket name',
  key: function(req, file, cb) {
      console.log(file);
      cb(null, file.originalname);
  }
})





var app = express();

app.get('/', function (req, res) {
  res.render('form');
});



// for parsing application/json
app.use(bodyParser.json());

app.post('/profile', upload1.single('file'), async function (req, res) {
  console.log(req.file);
  try {

    const filetypes = /jpeg|jpg|png|gif/;

    if (req.file === undefined) {
      res.send('Image not selected!')
    }
    const extName = filetypes.test(path.extname(req.file.originalname).toLowerCase());
    const mimetype = filetypes.test(req.file.mimetype);

    if (!(mimetype && extName)) {
      res.send('Select Images Only!')
    }

    const fileContent = await fs.readFileSync(req.file.path);
    const params = {
      Bucket: "hurrybucket",
      Key: Date.now() + req.file.originalname,
      Body: fileContent,
      ContentType: 'image/jpeg'
    };
    s3.upload(params).promise().then((data) => {
      console.log(data)
      res.send({code:200,message:"image uploaded successfully",url:data.Location})

    })
      .catch((err) => {
        console.log(err)
        res.send("There is an problem image not upload")

      })
  } catch (err) {
    console.log(err)
    res.send("recieved your request but error!", err);
  }
});




app.post('/upload', upload.single('file'), function (req, res, next) {
  console.log('Uploaded!');
  res.send(req.file);
});




app.listen((3001), () => {
  console.log("server is running...")
});
