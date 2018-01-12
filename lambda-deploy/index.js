'use strict';
const request = require('request');
const AWS = require('aws-sdk');
const fs = require('fs');
const zlib = require('zlib');

const path = 'static/';
const bucketName = "zenandmotorcycles.com";

const sns = new AWS.SNS();
const s3 = new AWS.S3({
  params: {
    Bucket: bucketName
  }
});

const computeContentType = (filename) => {
  const parts = filename.split('.');
  switch (filename.split('.')[parts.length-1]) {
    case 'png':
      return "image/png";
    case 'html':
      return "text/html";
    case 'js':
      return "application/javascript";
    case 'css':
      return "text/css";
  }
};

const putFileToS3 = (fileObject) => new Promise((resolve, reject) => {
  const gzip = zlib.createGzip();
  const publicFolderName = "/public/"
  const start = fileObject.download_url.indexOf(publicFolderName) + publicFolderName.length
  const filePath =  fileObject.download_url.substring(start);

  console.log(filePath)

  var randomFileName = Math.random();
  console.log(randomFileName)

  request(fileObject.download_url)
    .pipe(gzip)
    .pipe(fs.createWriteStream(`/tmp/${randomFileName}`))
    .on('finish', () => {
      s3.upload({
        Bucket: bucketName,
        Key: filePath,
        Body: fs.createReadStream(`/tmp/${randomFileName}`),
        ACL: 'public-read',
        CacheControl: 'max-age=0',
        ContentType: computeContentType(fileObject.name),
        ContentEncoding: 'gzip'
      }, (error) => {
        if (error) return reject();
        else return resolve();
      });
    });
});

var filesToDownload = []
var foldersToDownload = []
const downloadFolderFromGithub = (downloadUrl, callback) => {
  request({
    uri: downloadUrl,
    headers: {
      'User-Agent': 'AWS Lambda Function' // Without that Github will reject all requests
    }
  }, (error, response, body) => {
    console.log(body)
    JSON.parse(body).forEach((fileObject) => {
      if(fileObject.type == 'file'){
        filesToDownload.push(fileObject)
      } else if(fileObject.type == 'dir'){
        foldersToDownload.push(fileObject.url)
      }
    });

    if(foldersToDownload.length > 0){
      const folderUrl = foldersToDownload[0]
      foldersToDownload.splice(0, 1)
      downloadFolderFromGithub(folderUrl, callback)
    } else{
      console.log("Files to download ========= ")
      filesToDownload.forEach((fileObject) => {
        console.log(fileObject.name)
      })
      callback()
    }
  });
}

exports.handler = (event, context, callback) => {
  const downloadsUrl = "https://api.github.com/repos/singhnitin88/zenandmotorcycles/contents/public"

  downloadFolderFromGithub(downloadsUrl, () => {
    console.log("Downloading from Github and Uploading to S3 ======== ")
    filesToDownload.forEach((fileObject) => {
        putFileToS3(fileObject)
      })
  })
};