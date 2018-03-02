const testSauceLabs = require('test-saucelabs');

// https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities

testSauceLabs({
  platforms: [{
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: '16'
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
    version: 'latest'
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
