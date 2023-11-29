exports.local = {
	host: '127.0.0.1',
	port: 4723, // Port for local Appium runs.
};

exports.sauce = {
	user: process.env.SAUCE_USERNAME,
	key: process.env.SAUCE_ACCESS_KEY,
	hostname: 'ondemand.us-west-1.saucelabs.com',
	port: 443,
	baseUrl: 'wd/hub',
};
