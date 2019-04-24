const testSauceLabs = require('test-saucelabs');

// https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities

testSauceLabs({
	platforms: [{
		browserName: 'MicrosoftEdge',
		platform: 'Windows 10'
	}, {
		browserName: 'Safari',
		'appium-version': '1.7.1',
		platformName: 'iOS',
		platformVersion: '11.0',
		deviceName: 'iPhone 8 Simulator'
	}, {
		browserName: 'firefox',
		platform: 'Windows 10',
		version: 'latest'
	}, {
		browserName: 'safari',
		platform: 'OS X 10.13',
		version: '11',
	}, {
		browserName: 'googlechrome',
		platform: 'OS X 10.12',
		version: 'latest'
	}],
	urls: [{
		name: 'bit-docs-html-canjs',
		url: 'http://localhost:3000/test/browser.html?hidepassed'
	}],
	zeroAssertionsPass: false
});
