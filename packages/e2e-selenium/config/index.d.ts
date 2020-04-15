type webdriver = typeof import('selenium-webdriver');

declare global {
	namespace NodeJS {
		interface Global {
			webdriver: webdriver;
			driver: import('selenium-webdriver').WebDriver;
			By: webdriver[ 'By' ];
			until: webdriver[ 'until' ];
			Key: webdriver[ 'Key' ];
			WP_BASE_URL: string;
			WP_ADMIN_BASE_URL: string;
		}
	}

	const webdriver: webdriver;
	const driver: import('selenium-webdriver').WebDriver;
	const By: webdriver[ 'By' ];
	const until: webdriver[ 'until' ];
	const Key: webdriver[ 'Key' ];
	const WP_BASE_URL: string;
	const WP_ADMIN_BASE_URL: string;
}

export {};
