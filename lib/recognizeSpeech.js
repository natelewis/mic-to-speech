let Transform = require('stream').Transform;
let util = require('util');

/**
 * RecognizeSpeech stream transform
 * @param       {Options} options Transform options
 * @constructor
 */
function RecognizeSpeech(options) {
  let self = this;
  options = options || {};
  Transform.call(self, options);
};

util.inherits(RecognizeSpeech, Transform);

/**
 * Transform stream implementation
 * @param  {Buffer} data - Audio stream chunk
 * @param  {string} encoding - Encoding type
 * @param  {Function} callback - Internal callback from stream
 */
RecognizeSpeech.prototype._transform = function(data, encoding, callback) {
  let sample;
  let silenceLength = 0;
  let self = this;

  for (let i = 0; i < data.length; i = i + 2) {
    if (data[i + 1] > 128) {
      sample = (data[i + 1] - 256) * 256;
    } else {
      sample = data[i + 1] * 256;
    }
    sample += data[i];
    if (Math.abs(sample) > 2000) {
      // found some speech, we are done here
      self.emit('speaking', data);
      break;
    } else {
      silenceLength++;
    }
  }

  // if they match that means no sample matched high enough to qualify as
  // speech
  if (silenceLength === data.length / 2) {
    self.emit('silence', data);
  }

  callback(null, data);
};

module.exports = RecognizeSpeech;
