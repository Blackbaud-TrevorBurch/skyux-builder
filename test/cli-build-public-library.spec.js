/*jshint jasmine: true, node: true */
'use strict';

const mock = require('mock-require');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const logger = require('winston');
const skyPagesConfigUtil = require('../config/sky-pages/sky-pages.config');

describe('cli build-public-library', () => {
  const requirePath = '../cli/build-public-library';
  let webpackConfig;
  let mockWebpack;

  beforeEach(() => {
    mockWebpack = () => {
      return {
        run: (cb) => {
          cb(null, {
          toJson: () => ({
            errors: [],
            warnings: []
          })
        });
        }
      };
    };
    mock('../cli/utils/stage-library-ts', () => {});
    mock('../cli/utils/prepare-library-package', () => {});
    mock('../config/webpack/build-public-library.webpack.config.js', {
      getWebpackConfig: () => {
        webpackConfig = {
          entry: ''
        };
        return webpackConfig;
      }
    });
    spyOn(process, 'exit').and.callFake(() => {});
    spyOn(skyPagesConfigUtil, 'spaPath').and.returnValue('');
    spyOn(skyPagesConfigUtil, 'spaPathTemp').and.callFake((fileName = '') => {
      return fileName;
    });
    spyOn(rimraf, 'sync').and.callFake(() => {});
    spyOn(fs, 'writeJSONSync').and.callFake(() => {});
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should return a function', () => {
    const cliCommand = require(requirePath);
    expect(cliCommand).toEqual(jasmine.any(Function));
  });

  it('should clean the dist and temp directories', (done) => {
    const cliCommand = require(requirePath);
    cliCommand({}, mockWebpack).then(() => {
      expect(rimraf.sync).toHaveBeenCalled();
      expect(skyPagesConfigUtil.spaPathTemp).toHaveBeenCalled();
      expect(skyPagesConfigUtil.spaPath).toHaveBeenCalledWith('dist');
      done();
    });
  });

  it('should write a tsconfig.json file', (done) => {
    const cliCommand = require(requirePath);
    cliCommand({}, mockWebpack).then(() => {
      const firstArg = fs.writeJSONSync.calls.argsFor(0)[0];
      expect(firstArg).toEqual('tsconfig.json');
      done();
    });
  });

  it('should pass config to webpack', (done) => {
    const cliCommand = require(requirePath);
    cliCommand({}, mockWebpack).then(() => {
      expect(webpackConfig).toEqual(jasmine.any(Object));
      expect(webpackConfig.entry).toEqual(jasmine.any(String));
      done();
    });
  });

  it('should handle errors thrown by webpack', (done) => {
    const errorMessage = 'Something bad happened.';
    spyOn(logger, 'error');
    mockWebpack = () => {
      return {
        run: (cb) => cb(errorMessage)
      };
    };
    const cliCommand = mock.reRequire(requirePath);
    cliCommand({}, mockWebpack).then(() => {
      expect(logger.error).toHaveBeenCalledWith(errorMessage);
      done();
    });
  });
});
