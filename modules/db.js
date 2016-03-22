var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB);

//mongoimport -d sky -c programmes --jsonArray --file metadata.json
//mongoexport --db sky --collection programmes --out programmes.json

var ProgrammeSchema = mongoose.Schema({
  "programme_uuid": String,
  "name": String,
  "genre": String,
  "sub-genres": String,
  "tags": String,
  "synopsis": String,
  "sentiment": {
    "score": Number,
    "emotionType": String
  }
});

var ProgrammeModel = mongoose.model('Programme', ProgrammeSchema);

module.exports.ProgrammeModel = ProgrammeModel;
