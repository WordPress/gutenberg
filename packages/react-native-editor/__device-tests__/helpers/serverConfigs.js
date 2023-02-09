exports.local = {
	host: 'localhost',
	port: 4723, // Port for local Appium runs.
};

exports.sauce = {
	host: 'https://ondemand.us-west-1.saucelabs.com/wd/hub',
	port: 80,
	auth: process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY,
};
