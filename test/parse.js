'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const CloudFrontParser = require('../');

/* eslint-env node, mocha */

const web_example = fs.readFileSync(path.join(__dirname, './fixtures/web-1-0.txt'), 'utf-8');
const web_example1 = fs.readFileSync(path.join(__dirname, './fixtures/web-1-0-2019-12.txt'), 'utf-8');
const rtmp_example = fs.readFileSync(path.join(__dirname, './fixtures/rtmp-1-0.txt'), 'utf-8');
const kinesis_example = fs.readFileSync(path.join(__dirname, './fixtures/kinesis-1-0.txt'), 'utf-8');

describe('parse', function () {

  it('should parse web distribution v1.0 logs without error', function () {
    CloudFrontParser.parse(web_example, { format: 'web' });
  });

  it('should parse web distribution v1.0 (with additional fields from 2019-12) logs without error', function () {
    CloudFrontParser.parse(web_example1, { format: 'web' });
  });

  it('should parse RTMP distribution v1.0 logs without error', function () {
    CloudFrontParser.parse(rtmp_example, { format: 'rtmp' });
  });

  it('should parse Kinesis to Cloudfront v1.0 logs without error', function () {
    CloudFrontParser.parse(kinesis_example, { format: 'kinesis' });
  });


  it('should create a single object out of each line of web log, ignoring comments', function () {
    const result = CloudFrontParser.parse(web_example, { format: 'web' });
    assert.equal(2, result.length);
  });

  it('should create a single object out of each line of rtmp log, ignoring comments', function () {
    const result = CloudFrontParser.parse(rtmp_example, { format: 'rtmp' });
    assert.equal(6, result.length);
  });


  it('should create a single object out of each line of kinesis log, ignoring comments', function () {
    const result = CloudFrontParser.parse(kinesis_example, { format: 'kinesis' });
    assert.equal(1, result.length);
  });

  it('should default to web if format unspecified', function () {
    const result = CloudFrontParser.parse(web_example);
    
    assert.equal(2, result.length);
    assert.equal(24, Object.keys(result[0]).length);
  });

  it('should error on unrecognized format option', function () {
    assert.throws(CloudFrontParser.parse.bind(web_example, { format: 'not-valid' }), Error, 'Format not recognized: not-valid');
  });

  it('should map each web log field into correct result field', function () {
    const result = CloudFrontParser.parse(web_example, { format: 'web' });

    assert.equal('2014-05-23', result[0]['date']);
    assert.equal('FRA2', result[0]['x-edge-location']);
    assert.equal('/view/my/file.html', result[0]['cs-uri-stem']);
    assert.equal('RefreshHit', result[0]['x-edge-response-result-type']);
    assert.equal('LAX1', result[1]['x-edge-location']);
    assert.equal('/soundtrack/happy.mp3', result[1]['cs-uri-stem']);
  });

  it('should map fields added to web 1.0 format in 2019-12 into correct result fields', function () {
    const result = CloudFrontParser.parse(web_example1, { format: 'web' });

    assert.equal('Hit', result[0]['x-edge-detailed-result-type']);
    assert.equal('text/html', result[0]['sc-content-type']);
    assert.equal('78', result[0]['sc-content-len']);
  });

  it('should map each rtmp log field into correct result field', function () {
    const result = CloudFrontParser.parse(rtmp_example, { format: 'rtmp' });

    assert.equal('2010-03-12', result[0]['date']);
    assert.equal('SEA4', result[0]['x-edge-location']);
    assert.equal('myvideo', result[1]['x-sname']);
    assert.equal('flv', result[1]['x-file-ext']);
    assert.equal('2', result[4]['x-sid']);
    assert.equal('disconnect', result[5]['x-event']);
  });


  it('should map each kinesis log field into correct result field', function () {
    const result = CloudFrontParser.parse(kinesis_example, { format: 'kinesis' });

    assert.equal('1607374321.541', result[0]['timestamp']);
    assert.equal('127.0.0.1', result[0]['c-ip']);
    assert.equal('0.042', result[0]['time-to-first-byte']);
    assert.equal('200', result[0]['sc-status']);
    assert.equal('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:83.0) Gecko/20100101 Firefox/83.0', result[0]['cs-user-agent']);
  });



  it('should correctly decode percent-encoded fields', function () {
    const result = CloudFrontParser.parse(web_example, { format: 'web' });
    assert.equal('Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Version/10.0 Mobile/14D27 Safari/602.1', result[0]['cs-user-agent']);
  });

  it('should handle Buffers as well as strings', function () {
    const result = CloudFrontParser.parse(Buffer.from(web_example), { format: 'web' });
    assert.equal(2, result.length);
  });

  it('should call the callback function when specified', function (done) {
    CloudFrontParser.parse(Buffer.from(web_example), { format: 'web' }, function (err, result) {
      assert(result);
      done();
    });
  });
});