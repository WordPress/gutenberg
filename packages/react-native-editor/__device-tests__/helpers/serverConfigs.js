exports.local = {
	host: '127.0.0.1',
	port: 4723, // Port for local Appium runs.
};

exports.sauce = {
	host: 'ondemand.saucelabs.com',
	port: 80,
	auth: process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY,
};
