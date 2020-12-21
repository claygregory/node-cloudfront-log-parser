'use strict';

const stream = require('stream');
const util = require('util');

const formats = {
  'web_v1.0': [
    'date', 'time', 'x-edge-location', 'sc-bytes', 'c-ip',
    'cs-method', 'cs-host', 'cs-uri-stem', 'sc-status',
    'cs-referer', 'cs-user-agent', 'cs-uri-query', 'cs-cookie',
    'x-edge-result-type', 'x-edge-request-id', 'x-host-header',
    'cs-protocol', 'cs-bytes', 'time-taken', 'x-forwarded-for',
    'ssl-protocol', 'ssl-cipher', 'x-edge-response-result-type',
    'cs-protocol-version', 'fle-status', 'fle-encrypted-fields',
    'c-port', 'time-to-first-byte', 'x-edge-detailed-result-type',
    'sc-content-type', 'sc-content-len', 'sc-range-start',
    'sc-range-end'
  ],

  'rtmp_v1.0': [
    'date', 'time', 'x-edge-location', 'c-ip', 'x-event',
    'sc-bytes', 'x-cf-status', 'x-cf-client-id', 'cs-uri-stem',
    'cs-uri-query', 'c-referrer', 'x-page-url', 'c-user-agent',
    'x-sname', 'x-sname-query', 'x-file-ext', 'x-sid'
  ],

  'kinesis_v1.0': [
    'timestamp', 'c-ip', 'time-to-first-byte', 'sc-status',
    'sc-bytes', 'cs-method', 'cs-protocol', 'cs-host',
    'cs-uri-stem', 'cs-bytes', 'x-edge-location', 'x-edge-request-id',
    'x-host-header', 'time-taken', 'cs-protocol-version', 'c-ip-version',
    'cs-user-agent', 'cs-referer', 'cs-cookie', 'cs-uri-query',
    'x-edge-response-result-type', 'x-forwarded-for', 'ssl-protocol', 'ssl-cipher',
    'x-edge-result-type', 'fle-encrypted-fields', 'fle-status', 'sc-content-type',
    'sc-content-len', 'sc-range-start', 'sc-range-end', 'c-port',
    'x-edge-detailed-result-type', 'c-country', 'cs-accept-encoding', 'cs-accept',
    'cache-behavior-path-pattern', 'cs-headers', 'cs-header-names', 'cs-headers-count'
  ]

};

const option_defaults = {
  format: 'web',
  version: '1.0'
};

const decode_field = val => {
  return unescape(
    val.replace(/%2522/g, '"')
      .replace(/%255C/g, '\\')
      .replace(/%2520/g, ' ')
  );
};

const CloudFrontTransform = function (options) {

  this.options = options || {};
  stream.Transform.call(this, { objectMode: true });
};
util.inherits(CloudFrontTransform, stream.Transform);

CloudFrontTransform.prototype._transform = function (chunk, encoding, done) {

  encoding = encoding || 'utf8';
  if (Buffer.isBuffer(chunk)) {
    if (encoding == 'buffer') chunk = chunk.toString();
    else chunk = chunk.toString(encoding);
  }

  if (this._lastLineBuffer) chunk = this._lastLineBuffer + chunk;

  const lines = chunk.split('\n');
  this._lastLineBuffer = lines.splice(lines.length - 1, 1)[0];

  parse(lines, this.options).forEach(this.push.bind(this));
  done();
};

CloudFrontTransform.prototype._flush = function (done) {

  if (this._lastLineBuffer) {
    parse(this._lastLineBuffer, this.options).forEach(this.push.bind(this));
    this._lastLineBuffer = null;
  }

  done();
};

function parse(data, options, callback) {

  let parsed;
  let err;
  try {

    if (Buffer.isBuffer(data)) data = data.toString();

    if (typeof data === 'string') data = data.split('\n');

    parsed = data
      .filter(line => !line.startsWith('#'))
      .filter(line => line.length > 0)
      .map(line => parseLine(line, options));

  } catch (e) {
    err = e;
    if (!callback) throw e; 
  }

  if (callback) callback(err, parsed);
  else return parsed;
}

function parseLine(line, options) {

  options = options || {};

  let format = options.format;
  if (format === undefined) format = option_defaults.format;

  let version = options.version;
  if (version === undefined) version = option_defaults.version;

  const headings = formats[`${format}_v${version}`];
  if (!headings) throw new Error(`Format not recognized: ${format}`);

  const line_arr = line.split('\t');
  return _zipLine(line_arr, headings);
}

function _zipLine(arr, headings) {
  const result = {};
  for (let i = 0; i < Math.min(arr.length, headings.length); i++) {
    const field = headings[i];
    result[field] = decode_field(arr[i]);
  }

  return result;
}

module.exports = CloudFrontTransform;
module.exports.parse = parse;
module.exports.parseLine = parseLine;
