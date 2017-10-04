
/**
 * Copyright 2017 Nate Lewis All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Audio = require('./lib/Audio');
const DevNullStream = require('dev-null-stream');
const EventEmitter = require('events');

/**
 * Speech recordering returning speech segments as they are streamed
 */
class SpeechExtractor extends EventEmitter {
  /**
   * @param       {Object} options
   * @param       {number} options.sampleRateHertz - Sample rate (default 16000)
   * @param       {number} options.channels - Mic channels (default 1)
   * @constructor
   */
  constructor(options) {
    super();
    let self = this;

    let defaults = {
      callback: function() {
        console.log('Speech audio recieved');
      },
      sampleRateHertz: 16000,
      channels: 1,
    };

    // extend defaults
    options = Object.assign({}, defaults, options);

    // active speech data holder.
    self.activeSpeechBuffer = undefined;

    // mic settings
    let micSettings = {
      rate: options.sampleRateHertz,
      channels: options.channels,
      debug: options.debug,
    };

    // setup the mic streams
    self.micInstance = new Audio(micSettings);
    self.micInputStream = self.micInstance.getAudioStream();
    let devNull = new DevNullStream();
    self.micInputStream.pipe(devNull);

    // speaking action
    self.micInputStream.on('speaking', function(buffer) {
      // stay clean if we are paused
      if (self.micInstance.isPaused()) {
        self.resetCounters();
      } else {
        // append to the buffer of active speech
        self.appendToActiveSpeechBuffer(buffer);
        self.micInstance.incementSpeakingCount();
        self.micInstance.silenceCount = 0;
      }
    });

    // silence action
    self.micInputStream.on('silence', function(buffer) {
      // append to speech buffer if have started talking
      if (self.activeSpeechBuffer !== undefined) {
        self.appendToActiveSpeechBuffer(buffer);
      }
      // check if we met silence threashold
      if (self.micInstance.getSilenceCount() > 4) {
        if (self.micInstance.getSpeakingCount() > 1) {
          // we have enough speech to send it out and pause listening
          self.emit('speech', self.activeSpeechBuffer);
        }
        // if we processed or not, reset the counters
        self.resetCounters();
      }
      self.micInstance.incementSilenceCount();
    });
  }

  /**
   * Callback when potential speech is recorded
   *
   * @callback speechCallback
   * @param {Buffer} buffer - Buffer with raw audio in it.
   */

  /**
   * Append buffer to current active speech
   * @param  {Buffer} buffer - Chunk of current silence or speech
   */
  appendToActiveSpeechBuffer(buffer) {
    // append to the buffer of active speech
    if (typeof(this.activeSpeechBuffer) !== 'object') {
      this.activeSpeechBuffer = buffer;
    } else {
      let bufferLength = this.activeSpeechBuffer.length + buffer.length;
      let bufferList = [this.activeSpeechBuffer, buffer];
      this.activeSpeechBuffer = Buffer.concat(bufferList, bufferLength);
    }
  }

  /**
   * Reset the counters used for speech detection
   */
  resetCounters() {
    this.micInstance.silenceCount = 0;
    this.micInstance.speakingCount = 0;
    this.activeSpeechBuffer = undefined;
  }

  /**
   * Start mic listner.  If speech is detected, the callback will run and the
   * listner will be paused.
   */
  start() {
    this.micInstance.start();
  }

  /**
   * Pause the mic listener
   */
  pause() {
    this.micInstance.pause();
  }

  /**
   * Resume the mic listener.  This should be called after your speech
   * processing callback is finished.
   */
  resume() {
    this.micInstance.resume();
  }

  /**
   * Stop listening and exit
   */
  stop() {
    this.micInstance.stop();
  };
}

module.exports = SpeechExtractor;
