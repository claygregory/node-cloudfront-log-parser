
# CloudFront Access Log Parser

This is a log parser for Cloudfront Web Distribution and RTMP Distribution access logs. It can be called directly or with the Node.js Stream API.

[![Build Status](https://travis-ci.org/claygregory/node-cloudfront-log-parser.svg?branch=master)](https://travis-ci.org/claygregory/node-cloudfront-log-parser)
[![Coverage Status](https://coveralls.io/repos/github/claygregory/node-cloudfront-log-parser/badge.svg?branch=master)](https://coveralls.io/github/claygregory/node-cloudfront-log-parser?branch=master)

## Installation

```bash
npm install --save cloudfront-log-parser
```

## Usage Examples

### Synchronous API
Given a string or Buffer of a log file, the `parse` function can be called directly, returning an array of parsed log entries.
```javascript
const CloudFrontParser = require('cloudfront-log-parser');
const accesses = CloudFrontParser.parse('<contents of log file>', { format: 'web' });
//accesses = array of objects, see below for format
```

### Callback API
If `parse` is provided with a callback function, it will be called with an array of parsed entries as the result.
```javascript
const CloudFrontParser = require('cloudfront-log-parser');
CloudFrontParser.parse('<contents of log file>', { format: 'web' }, function (err, accesses) {
  //accesses = array of objects, see below for format
});
```

### Node.js Stream API

The parser also implements `stream.Transform` for use in Node.js Streams.

```javascript
const CloudFrontParser = require('cloudfront-log-parser');
const fs = require('fs');
const zlib = require('zlib');

const parser = new CloudFrontParser({ format: 'web' });
parser.on('readable', function () {
  let access;
  while (access = parser.read()) {
    //access = parsed entry object
  }
});

fs.createReadStream('./somelogfile.gz')
  .pipe(zlib.createGunzip())
  .pipe(parser);
```

### Options

Only two configuration options are currently in effect: format and version. The parser defaults to `web` to handle the web distribution file format. If logs are streaming from CloudFront to Kinesis the format should be set to `kinesis` as the column headers and order changes. If logs are from an RTMP distribution, this value should be set to `rtmp`. Currently all CloudFront logs are on version 1.0; should future versions appear, the `version` option will serve as an override.

```javascript
const options = {
  format: 'web|rtmp|kinesis',
  version: '1.0'
};
```

## Result Object

### Web Distribution Format

```javascript
{ 'date': '2017-02-09',
  'time': '17:50:17',
  'x-edge-location': 'MUC51',
  'sc-bytes': '2797',
  'c-ip': '192.168.0.123',
  'cs-method': 'GET',
  'cs-host': 'yourdistribution.cloudfront.net',
  'cs-uri-stem': '/',
  'sc-status': '200',
  'cs-referer': '-',
  'cs-user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'cs-uri-query': '-',
  'cs-cookie': '-',
  'x-edge-result-type': 'Hit',
  'x-edge-request-id': 'sjXpb8nMq_1ewovZ6nrojpvxIETPbo7EhF2RNtPZ_zfd0MtOW6pjlg==',
  'x-host-header': 'example.com',
  'cs-protocol': 'https',
  'cs-bytes': '148',
  'time-taken': '0.002',
  'x-forwarded-for': '-',
  'ssl-protocol': 'TLSv1.2',
  'ssl-cipher': 'ECDHE-RSA-AES128-GCM-SHA256',
  'x-edge-response-result-type': 'Hit',
  'cs-protocol-version': 'HTTP/1.1' }
```


### CloudFront to Kinesis Distribution Format
```javascript
{ 'timestamp': '1607374321.541',
  'c-ip': '127.0.0.1',
  'time-to-first-byte': '0.042',
  'sc-status': '200',
  'sc-bytes': '485',
  'cs-method': 'GET',
  'cs-protocol': 'http',
  'cs-host': 'test.cloudfront.net',
  'cs-uri-stem': '/i?hello=1',
  'cs-bytes': '745',
  'x-edge-location': 'EWR52-C4',
  'x-edge-request-id': '6PfZe0cc_AjXUjFuGnL9pGOmFdUx8xR8ZU8nr44JYJWi-DaeJjcxkw==',
  'x-host-header': 'test.cloudfront.net',
  'time-taken': '0.042',
  'cs-protocol-version': 'HTTP/1.1',
  'c-ip-version': 'IPv4',
  'cs-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:83.0) Gecko/20100101 Firefox/83.0',
  'cs-referer': 'http://localhost:5000/page-2',
  'cs-cookie': '-',
  'query-params': 'hello=1607374321563',
  'x-edge-response-result-type': 'Miss',
  'x-forwarded-for': '-',
  'ssl-protocol': '-',
  'ssl-cipher': '-',
  'x-edge-result-type': 'Miss',
  'fle-encrypted-fields': '-',
  'fle-status': '-',
  'sc-content-type': 'image/gif',
  'sc-content-len': '35',
  'sc-range-start': '-',
  'sc-range-end': '-',
  'c-port': '49323',
  'x-edge-detailed-result-type': 'Miss',
  'c-country': 'US',
  'cs-accept-encoding': 'gzip, deflate',
  'cs-accept': 'image/webp,*/*',
  'cache-behavior-path-pattern': '*',
  'cs-headers': 'Host:test.cloudfront.net\n...',
  'cs-headers-count': '8'
}
```

### RTMP Distribution Format

```javascript
{ 'date': '2010-03-12',
  'time': '23:56:21',
  'x-edge-location': 'SEA4',
  'c-ip': '192.0.2.199',
  'x-event': 'stop',
  'sc-bytes': '429822014',
  'x-cf-status': 'OK',
  'x-cf-client-id': 'bfd8a98bed0840d2b871b7f6adf9908f',
  'cs-uri-stem': 'rtmp://yourdistribution.cloudfront.net/cfx/st',
  'cs-uri-query': 'key=value',
  'c-referrer': 'http://player.example.com/player.swf',
  'x-page-url': 'http://www.example.com/video',
  'c-user-agent': 'LNX 10,0,32,18',
  'x-sname': '-',
  'x-sname-query': '-',
  'x-file-ext': '-',
  'x-sid': '-' }
```

## License

See the included [LICENSE](LICENSE.md) for rights and limitations under the terms of the MIT license.