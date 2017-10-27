let Mic = require('node-microphone');
let RecognizeSpeech = require('./RecognizeSpeech.js');

/**
 * [Audio description]
 * @param       {Object} micSettings Options to pass down to node-mircophone
 * @constructor
 */
function Audio(micSettings) {
  this.speakingCount = 0;
  this.startTime;
  this.silenceCount = 0;
  this.micStream;
  this.paused = false;
  this.audioStream = new RecognizeSpeech();
  this.mic = new Mic(micSettings);
}

/**
 * Start the recording stream and the speech recognition
 */
Audio.prototype.start = function() {
  this.micStream = this.mic.startRecording();
  this.micStream.pipe(this.audioStream);
  this.audioStream.emit('startComplete');
};

/**
 * Stop the streams
 */
Audio.prototype.stop = function() {
  this.mic.stopRecording();
};

/**
 * Check paused state
 * @return {Boolean} True if we are paused
 */
Audio.prototype.isPaused = function() {
  return this.paused;
};

/**
 * Pause the speech recognition
 */
Audio.prototype.pause = function() {
  this.paused = true;
  this.audioStream.emit('pauseComplete');
};

/**
 * Resume the speech recognition
 */
Audio.prototype.resume = function() {
  this.paused = false;
  this.audioStream.emit('resumeComplete');
};

/**
 * Return the active audio stream
 * @return {Stream} - Audio stream
 */
Audio.prototype.getAudioStream = function getAudioStream() {
  return this.audioStream;
};

/**
 * Return current speaking count
 * @return {number} - Current speaking count
 */
Audio.prototype.getSpeakingCount = function getSpeakingCount() {
  return this.speakingCount;
};

/**
 * Return current silence count
 * @return {number} - Current silence count
 */
Audio.prototype.getSilenceCount = function getSilenceCount() {
  return this.silenceCount;
};

/**
 * Increment the speaking count by one
 * @return {number} - Current speaking count
 */
Audio.prototype.incementSpeakingCount = function incementSpeakingCount() {
  return this.speakingCount++;
};

/**
 * Increment the silence count by one
 * @return {number} - Current silence count
 */
Audio.prototype.incementSilenceCount = function incementSilenceCount() {
  return this.silenceCount++;
};

module.exports = Audio;
