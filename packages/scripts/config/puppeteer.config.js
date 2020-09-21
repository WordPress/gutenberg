module.exports = {
	launch: {
		devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
		args: [
			'--disable-gpu',
			'--renderer',
			'--no-sandbox',
			'--no-service-autorun',
			'--no-experiments',
			'--no-default-browser-check',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			'--no-first-run',
			'--no-zygote',
			'--single-process',
			'--disable-extensions',
		],
	},
};
