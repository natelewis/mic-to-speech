# mic-to-speech

Watches your microphone stream to pull out speech segments that you can save to a file, or send to an endpoint for speech recognition.  Ideal for saving audio for conversation monitoring and assistant apps that work like Google Home or Amazon Alexa.

Supports Mac, Windows, Linux and Raspberry Pi.  

## Usage

```javascript
const MicToSpeech = require('mic-to-speech');

let micToSpeech = new MicToSpeech();

micToSpeech.on('speech', function(buffer) {
  console.log('buffer of speech received');
});

micToSpeech.start();
console.log('Listening for speech')
```

## Example Usage

#### Save raw audio to disk every time speech like audio is detected

```javascript
const MicToSpeech = require('mic-to-speech');
const fs = require('fs');

let micToSpeech = new MicToSpeech();

micToSpeech.on('speech', function(rawAudio) {
  // create filename
  let now = new Date();
  let filename = (now.getMonth() + 1) + "-" + now.getDate()
    + "-" + now.getFullYear() + ' ' + now.getHours()
    + ':' + now.getMinutes() + ':' + now.getSeconds() + '.raw';

    // write to a file and restart speech detection
    fs.writeFile(filename, rawAudio, function() {
        console.log('saved: ' + filename);
        micToSpeech.resume();
    });
};

micToSpeech.start();
console.log('Listening for speech');
```

Note: This is a header-less wav file, so you will need a compatible software to play them.  On a Mac you can play them with play:
```sh
play -b 16 -e signed -c 1 -r 16000 someDatedFile.raw
```

#### Have a two way AI conversation with speech recognition
```javascript
'use strict';

const ElizaBot = require('eliza-as-promised');
const say = require('say');
const MicToSpeech = require('mic-to-speech');
const Speech = require('google-speech-from-buffer');

// create our instance of eliza
const eliza = new ElizaBot();

// in a standard env this will pick up and watch the microphone
const micToSpeech = new MicToSpeech();

micToSpeech.on('speech', function(buffer) {
  // pause my speech so I don't listen to what I'm saying
  micToSpeech.pause();
  // process the speech with Google API and get a reply
  new Speech().recognize(buffer)
    .then((statement) => converseWithEliza(statement));
});

let converseWithEliza = function(statement) {
  // you said this to eliza
  console.log('<< ' + statement);
  // Eliza to respond
  eliza.getResponse(statement)
    .then((response) => {
      // keep the convo going!
      if (response.reply) {
        elizaSay(response.reply, function() {
          micToSpeech.resume();
        });
      }
      // final statement received, quit response and exit
      if (response.final) {
        elizaSay(response.final, function() {
          micToSpeech.stop();
          process.exit(0);
        });
      }
    });
};

let elizaSay = function(words, callback) {
  console.log('>> ' + words);
  say.speak(words, undefined, 1.0, function(err) {
    if (err) {
      return console.error(err);
    }
    callback();
  });
};

// Have Eliza start the conversation with an initial statement
elizaSay(eliza.getInitial(), function() {
  micToSpeech.start();
});
```
