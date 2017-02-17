'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const CloudFrontParser = require('../');

/* eslint-env node, mocha */

describe('stream_transform', function () {

  it('should emit each line of log on read', function (done) {

    let i = 0;
    const parser = new CloudFrontParser({ format: 'web' });
    parser.on('readable', function (){
      let access;
      while ((access = parser.read()) !== null) {
        assert(access);
        i++;
      }
    });

    parser.on('end', function (){
      assert(2, i);
      done();
    });

    fs.createReadStream(path.join(__dirname, './fixtures/web.txt'))
      .pipe(parser);
  });

});