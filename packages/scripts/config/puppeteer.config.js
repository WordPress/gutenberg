const { launchArgs } = require( 'puppeteer-testing-library' );

module.exports = {
	launch: {
		devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
		args: launchArgs(),
	},
};
