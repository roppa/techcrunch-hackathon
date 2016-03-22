'use strict';
let fs = require('fs');
let ProgrammeModel = require('../db').ProgrammeModel;
//watson
let watson = require('watson-developer-cloud');
let alchemy_language = watson.alchemy_language({
  api_key: process.env.WATSON_ALCHEMY_LANGUAGE_KEY
});
let visual_recognition = watson.visual_recognition({
  username: process.env.WATSON_USERNAME,
  password: process.env.WATSON_PASSWORD,
  version: process.env.WATSON_VERSION
});

//twillio
const ACCOUNT_SID = process.env.TWILLIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILLIO_AUTH_TOKEN;
const TELEPHONE_NUMBER = process.env.TWILLIO_TELEPHONE_NUMBER;

let client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

let emotions = {
  'wonderful': { "sentiment.emotionType" : "positive" },
  'awesome': { "sentiment.emotionType" : "positive" },
  'positive': { "sentiment.emotionType" : "positive" },
  'excited': { "sentiment.emotionType" : "positive" },
  'happy': { "sentiment.emotionType" : "positive" },
  'super': { "sentiment.emotionType" : "positive" },
  'energetic': { "sentiment.emotionType" : "positive" },
  'excited': { "sentiment.emotionType" : "positive" },
  ':-D': { "sentiment.score" : { $gt : 0.6, $lt : 0.9 } },
  ':D': { "sentiment.score" : { $gt : 0.6, $lt : 0.9 } },
  ':‑)': { "sentiment.score" : { $gt : 0.4, $lt : 0.8 } },
  ':-))': { "sentiment.score" : { $gt : 0.5, $lt : 0.4 } },
  ':)': { "sentiment.score" : { $gt : 0.5, $lt : 0.4 } },
  ':o)': { "sentiment.score" : { $gt : 0.4, $lt : 0.3 } },
  ':]': { "sentiment.score" : { $gt : 0.3, $lt : 0.2 } },
  ':3': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':c)': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':>': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  '=]': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  '8)': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  '=)': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':}': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':^)': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':っ)': { "sentiment.score" : { $gt : 0.2, $lt : 0 } },
  ':-|': { "sentiment.emotionType" : "neutral" },
  'neutral': { "sentiment.emotionType" : "neutral" },
  'bored': { "sentiment.emotionType" : "neutral" },
  'meh': { "sentiment.emotionType" : "neutral" },
  '>:[': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':‑(': { "sentiment.emotionType" : "negative" },
  ':(': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':‑c': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':c': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  'angry': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  'hurt': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':‑<': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':っC': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':<': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':‑[': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':[': { "sentiment.score" : { $gt : -0.3, $lt : -0.4 } },
  ':{': { "sentiment.score" : { $gt : -0.4, $lt : -0.5 } },
  ':\'(': { "sentiment.score" : { $gt : -0.5, $lt : -0.6 } },
  'unhappy': { "sentiment.score" : { $gt : -0.6, $lt : -0.7 } },
  'sad': { "sentiment.score" : { $gt : -0.7, $lt : -0.8 } },
  'cry': { "sentiment.score" : { $gt : -0.7, $lt : -0.8 } },
  'negative': { "sentiment.score" : { $gt : -0.8, $lt : -0.9 } },
  'apathetic': { "sentiment.score" : { $gt : -0.9, $lt : -1  }}
};

var controller = {

  all: function (req, res) {
    ProgrammeModel
      .find({})
      .limit(10)
      .exec(function (error, programmes) {
        if (error) {
          res.json(error);
        } else {
          res.json(programmes);
        }
      });
  },

  get: function (req, res) {

    ProgrammeModel
      .findOne({ "sentiment.emotionType": req.params.rating })
      .exec(function (error, programme) {
        if (error) {
          res.json(error);
        } else {
          res.json({ name: programme.name });
        }
      });
  },

  /**
   * Rating
   *
   * fantastic - 100
   * 
   * shit - 0
   * 
   * 0 - 100
   * -.0
   * -.
   * -.99
   */
  postRating: function (req, res) {

    var sms = req.body;
    var rawRating = sms.Body;
    var rating = { "sentiment.emotionType" : "neutral" };

    if (!isNaN(rawRating)) {

      rawRating = parseInt(rawRating, 10);

      if (rawRating > 0) {
        if (rawRating > 100) {
          rawRating = 100;
        }
        rawRating = -Math.abs(rawRating / 100);
      }

      rating = { "sentiment.score" : { $gt : +rawRating + -0.1, $lt : +rawRating } };

    } else {
      rawRating = sms.Body.toLowerCase().trim() || 'neutral';
      if (rawRating in emotions) {
        rating = emotions[rawRating];
      }
    }

    ProgrammeModel
      .find(rating)
      .exec(function (error, programmes) {
        if (error) {
          res.json(error);
        } else {
          var programme = programmes[Math.floor(Math.random() * programmes.length - 1)] || {};
          programme.name = programme.name || 'Can\'t find one? Try again?';
          client.messages.create({
            to: sms.From, 
            from: TELEPHONE_NUMBER, 
            body: programme.name || 'Something went wrong!',
          }, function(err, message) { 
            if (err) {
              res.json(err);
            } else {
              res.json(message.sid); 
            }
          });
        }
      });
  },

  emotion: function (req, res) {
    var rawRating = parseInt(req.params.num, 10);
    rawRating = rawRating || 50;

    var rating = { 
      lt: -0.4, 
      gt: -0.5
    };

    if (rawRating > 0) {
      if (rawRating > 100) {
        rawRating = 100;
      }
      rawRating = -Math.abs(rawRating / 100);
    }

    rating = {
      lt: +rawRating,
      gt: +rawRating + -0.1
    };

    ProgrammeModel
      .find({ "sentiment.score" : { $gt : rating.gt, $lt : rating.lt } })
      .exec(function (error, programmes) {
        if (error) {
          res.json({ error: error.message });
        } else {
          var programme = programmes[Math.floor(Math.random() * programmes.length - 1)];
          if (programme && programme.name) {
            res.json({ name: programme.name });
          }
        }
      });
  },

  postPhoto: function (req, res) {

    var params = {
      image_file: fs.createReadStream(__dirname + '/../../uploads/mark.png')
    };

    visual_recognition.recognize(params, function(err, result) {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    });

  },

  post: function (req, res) {

    var params = {
      text: req.body.text
    };

    alchemy_language.sentiment(params, function (err, response) {
      if (err) {
        res.json({ error: err });
      } else {
        res.json(response.docSentiment);
      }
    });

  }

  ,
  importer: function (req, res) {

    ProgrammeModel
      //.find({ sentiment: { $exists: false } })
      .find()
      .exec(function (error, programmes) {

        if (error) {
          console.log(error);
          res.json(error);
        } else {
          var count = 0;
          setInterval(function () {

            var params = {
              text: programmes[count].name + ', ' + programmes[count].synopsis + ', ' + programmes[count].tags
            };

            alchemy_language.sentiment(params, function (err, response) {
              if (err) {
                console.log(err);
              } else {

                programmes[count].sentiment = {
                  score: (response.docSentiment.score) ? parseInt(response.docSentiment.score) : -0.5,
                  emotionType: response.docSentiment.type || ''
                };

                programmes[count].save(function (error) {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log("saved", programmes[count].programme_uuid);
                  }
                });

              }
            });

            count++;

          }, 1000);

        }
      });

  }

};

module.exports = controller;
