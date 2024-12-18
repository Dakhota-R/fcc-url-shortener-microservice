require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const { Schema } = mongoose;

// set dns options
const options = {
  all: true,
};

// connect to mongoose
try {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (error) {
  console.log(error)
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// TODOs
// convert back to only accepting http:// leading

const shortSchema = new Schema({
  original_url: String,
  short_url: { type: Number, unique: true}
})

const ShortURL = new mongoose.model("short_url", shortSchema)

app.post('/api/shorturl', function(req, res){

  //const slice_regex = /https:\/\//ig;
  // if original_url contains https://
  //if (req.body.url.match(slice_regex)){
  //  original_url = req.body.url.slice(8)
  //} else {
  //  original_url = req.body.url
  //}


  // check for url in database
  ShortURL.find({ original_url: req.body.url }, {_id:0, __v:0}, function(err, docs) {
    // if found
    if (docs.length > 0){
      //console.log(docs[0]['short_url'])
      res.json(docs[0])
      return
    } else {
      // if not in database
      dns.lookup(req.body.url.slice(8), function(err, address){
      var dns = address
      if (dns){
        // if address resolves, set short url
        var rand_num = Math.floor(Math.random() * 90000) + 10000
        var short_url = new ShortURL({ original_url: req.body.url, short_url: rand_num })
        short_url.save();
        console.log("short url: ", rand_num)
        res.json({ original_url: req.body.url, short_url: rand_num })
      } else {
        // if not resolve send error
        res.json({ error: 'invalid url' })
      }

      
      })
    }
  })
})

// redirect to site when passed /api/shorturl/<short_url>
app.get('/api/shorturl/:shorturl', function(req, res){
  //console.log(req.params.shorturl)
  ShortURL.find({short_url: req.params.shorturl}, function(err, docs){
    if (docs) {
      console.log(docs[0]['original_url'])
      res.redirect(docs[0]['original_url'])
    } else {
      res.json({ error: 'invalid url' })
    }
  })
})

// wipedb on restart
ShortURL.remove({}, function(){})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
