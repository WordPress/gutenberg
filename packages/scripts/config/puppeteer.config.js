module.exports = {
	launch: {
		devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
		args: [
			'--enable-blink-features=ComputedAccessibilityInfo',
			'--disable-web-security',
			'--bwsi',
			'--disable-back-forward-cache',
			'--disable-domain-reliability',
			'--disable-extensions',
			'--disable-popup-blocking',
			'--disable-timeouts-for-profiling',
			'--disable-vsync-for-tests',
			// '--enable-low-end-device-mode',
			'--js-flags="--gc_experiment_less_compaction --expose-gc --sampling_heap_profiler_suppress_randomness --predictable --predictable_gc_schedule --single_threaded"',
			'--single-process',
		],
	},
};
