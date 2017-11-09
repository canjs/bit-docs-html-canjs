const testSauceLabs = require('test-saucelabs');

// https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities

testSauceLabs({
  platforms: [{
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '11'
  }, {
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: '14'
  }, {
    'appium-version': '1.6.3',
    browserName: 'safari',
    deviceName: 'iPhone 7 Simulator',
    platform: 'iOS',
    version: '10.0'
  }, {
    browserName: 'firefox',
    platform: 'Windows 7',
    version: '45'
  }, {
    browserName: 'safari',
    platform: 'OS X 10.12',
    version: '10'
  }, {
    browserName: 'googlechrome',
    platform: 'Windows 7',
    version: '45'
  }],
  urls: [{
    name: 'bit-docs-html-canjs',
    url: 'http://localhost:3000/test/browser.html?hidepassed'
  }],
  zeroAssertionsPass: false
});
