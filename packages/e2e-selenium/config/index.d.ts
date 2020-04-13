type webdriver = typeof import('selenium-webdriver');

declare global {
	namespace NodeJS {
		interface Global {
			webdriver: webdriver;
			driver: import('selenium-webdriver').WebDriver;
			By: webdriver[ 'By' ];
			until: webdriver[ 'until' ];
			Key: webdriver[ 'Key' ];
		}
	}

	const webdriver: webdriver;
	const driver: import('selenium-webdriver').WebDriver;
	const By: webdriver[ 'By' ];
	const until: webdriver[ 'until' ];
	const Key: webdriver[ 'Key' ];
}

export {};
