module.exports = {
	launch: {
		devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		product: process.env.PUPPETEER_PRODUCT || 'chrome',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
	},
};
