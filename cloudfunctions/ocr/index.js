// Based on https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/functions/ocr

'use strict';

var async = require('async');
var config = require('./config.json');
var gcloud = require('gcloud');
var request = require('request');

var pubsub = gcloud.pubsub();
var storage = gcloud.storage();
var vision = gcloud.vision();
var translate = gcloud.translate({
  key: config.TRANSLATE_API_KEY
});

/**
 * Publishes the result to the given pubsub topic and returns a Promise.
 *
 * @param {string} topicName Name of the topic on which to publish.
 * @param {Object} data The data to publish.
 * @param {Function} callback Callback function.
 */
function publishResult (topicName, data, callback) {
  return pubsub.topic(topicName).get({
    autoCreate: true
  }, function (err, topic) {
    if (err) {
      return callback(err);
    }
    // Pub/Sub messages must be valid JSON objects with a data property.
    return topic.publish({
      data: data
    }, callback);
  });
}

/**
 * Detects the text in an image using the Google Vision API.
 *
 * @param {string} filename Name of the file to scan.
 * @param {Object} image Cloud Storage File instance.
 */
function detectText (filename, image, callback) {
  var text;

  return async.waterfall([
    // Read the text from the image.
    function (cb) {
      console.log('Looking for text in file ' + filename);
      vision.detectText(image, cb);
    },
    // Detect the language to avoid unnecessary translations
    function (result, apiResponse, cb) {
      text = result[0];
      console.log('Extracted text from image (' + text.length + ' chars)');
      translate.detect(text, cb);
    },
    // Publish results
    function (result, cb) {
      console.log('Detected language "' + result.language + '" for ' + filename);
      // Submit a message to the bus for each language we're going to translate to
      var tasks = config.TO_LANG.map(function (lang) {
        var topicName = config.TRANSLATE_TOPIC;
        if (result.language === lang) {
          topicName = config.RESULT_TOPIC;
        }
        var payload = {
          text: text,
          filename: filename,
          lang: lang,
          from: result.language
        };
        return function (cb) {
          publishResult(topicName, payload, cb);
        };
      });
      async.parallel(tasks, cb);
    }
  ], callback);
}

/**
 * Appends a .txt suffix to the image name.
 *
 * @param {string} filename Name of a file.
 * @param {string} lang Language to append.
 * @returns {string} The new filename.
 */
function renameImageForSave (filename, lang) {
  var dotIndex = filename.indexOf('.');
  var suffix = '_to_' + lang + '.txt';
  if (dotIndex !== -1) {
    filename = filename.replace(/\.[^/.]+$/, suffix);
  } else {
    filename += suffix;
  }
  return filename;
}

/**
 * Cloud Function triggered by Cloud Storage when a file is uploaded.
 *
 * @param {Object} context Cloud Function context.
 * @param {Function} context.success Success callback.
 * @param {Function} context.failure Failure callback.
 * @param {Object} data Request data, in this case an object provided by Cloud Storage.
 * @param {string} data.bucket Name of the Cloud Storage bucket.
 * @param {string} data.name Name of the file.
 * @param {string} [data.timeDeleted] Time the file was deleted if this is a deletion event.
 * @see https://cloud.google.com/storage/docs/json_api/v1/objects#resource
 */
exports.processImage = function processImage (context, data) {
  try {
    if (data.hasOwnProperty('timeDeleted')) {
      // This was a deletion event, we don't want to process this
      return context.done();
    }

    if (!data.bucket) {
      throw new Error('Bucket not provided. Make sure you have a ' +
        '"bucket" property in your request');
    }
    if (!data.name) {
      throw new Error('Filename not provided. Make sure you have a ' +
        '"name" property in your request');
    }

    var bucket = storage.bucket(data.bucket);
    var file = bucket.file(data.name);
    detectText(data.name, file, function (err) {
      if (err) {
        console.error(err);
        return context.failure(err);
      }
      console.log('Processed ' + data.name);
      return context.success();
    });
  } catch (err) {
    console.error(err);
    return context.failure(err.message);
  }
};

/**
 * Translates text using the Google Translate API. Triggered from a message on
 * a Pub/Sub topic.
 *
 * @param {Object} context Cloud Function context.
 * @param {Function} context.success Success callback.
 * @param {Function} context.failure Failure callback.
 * @param {Object} data Request data, in this case an object provided by the Pub/Sub trigger.
 * @param {Object} data.text Text to be translated.
 * @param {Object} data.filename Name of the filename that contained the text.
 * @param {Object} data.lang Language to translate to.
 */
exports.translateText = function translateText (context, data) {
  try {
    if (!data.text) {
      throw new Error('Text not provided. Make sure you have a ' +
        '"text" property in your request');
    }
    if (!data.filename) {
      throw new Error('Filename not provided. Make sure you have a ' +
        '"filename" property in your request');
    }
    if (!data.lang) {
      throw new Error('Language not provided. Make sure you have a ' +
        '"lang" property in your request');
    }

    console.log('Translating text into ' + data.lang);
    return translate.translate(data.text, {
      from: data.from,
      to: data.lang
    }, function (err, translation) {
      if (err) {
        console.error(err);
        return context.failure(err);
      }

      return publishResult(config.RESULT_TOPIC, {
        text: translation,
        filename: data.filename,
        lang: data.lang
      }, function (err) {
        if (err) {
          console.error(err);
          return context.failure(err);
        }
        console.log('Text translated to ' + data.lang);
        return context.success();
      });
    });
  } catch (err) {
    console.error(err);
    return context.failure(err.message);
  }
};

/**
 * Saves the data packet to a file in GCS. Triggered from a message on a Pub/Sub
 * topic.
 *
 * @param {Object} context Cloud Function context.
 * @param {Function} context.success Success callback.
 * @param {Function} context.failure Failure callback.
 * @param {Object} data Request data, in this case an object provided by the Pub/Sub trigger.
 * @param {Object} data.text Text to save.
 * @param {Object} data.filename Name of the filename that contained the text.
 * @param {Object} data.lang Language of the text.
 */
exports.saveResult = function saveResult (context, data) {
  try {
    if (!data.text) {
      throw new Error('Text not provided. Make sure you have a ' +
        '"text" property in your request');
    }
    if (!data.filename) {
      throw new Error('Filename not provided. Make sure you have a ' +
        '"filename" property in your request');
    }
    if (!data.lang) {
      throw new Error('Language not provided. Make sure you have a ' +
        '"lang" property in your request');
    }

    console.log('Received request to save file ' + data.filename);

    var bucketName = config.RESULT_BUCKET;
    var filename = renameImageForSave(data.filename, data.lang);
    var file = storage.bucket(bucketName).file(filename);

    console.log('Saving result to ' + filename + ' in bucket ' + bucketName);

    file.save(data.text, function (err) {
      if (err) {
        console.error(err);
        return context.failure(err);
      }
      console.log('Text written to ' + filename);

      return context.success();

      request.post('https://execute-api.us-east-1.amazonaws.com/prod/test', {
        json: { payload: data.text }
      }, function(error, response, body) {

        console.log('-------');
        console.log(body);
        console.log(response);

        return context.success();
      });


    });
  } catch (err) {
    console.error(err);
    return context.failure(err.message);
  }
};
