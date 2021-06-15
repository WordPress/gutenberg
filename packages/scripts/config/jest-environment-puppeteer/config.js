/**
 * Parts of this source were derived and modified from the package
 * jest-environment-puppeteer, released under the MIT license.
 *
 * https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-environment-puppeteer
 *
 * Copyright 2018 Smooth Code
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { promisify } = require( 'util' );
const cwd = require( 'cwd' );
const merge = require( 'merge-deep' );

const exists = promisify( fs.exists );

const DEFAULT_CONFIG = {
	launch: {},
	browser: 'chromium',
	browserContext: 'default',
	exitOnPageError: true,
};
const DEFAULT_CONFIG_CI = merge( DEFAULT_CONFIG, {
	launch: {
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-background-timer-throttling',
			'--disable-backgrounding-occluded-windows',
			'--disable-renderer-backgrounding',
		],
	},
} );

async function readConfig() {
	const defaultConfig =
		process.env.CI === 'true' ? DEFAULT_CONFIG_CI : DEFAULT_CONFIG;

	const hasCustomConfigPath = !! process.env.JEST_PUPPETEER_CONFIG;
	const configPath =
		process.env.JEST_PUPPETEER_CONFIG || 'jest-puppeteer.config.js';
	const absConfigPath = path.resolve( cwd(), configPath );
	const configExists = await exists( absConfigPath );

	if ( hasCustomConfigPath && ! configExists ) {
		throw new Error(
			`Error: Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${ configPath }`
		);
	}

	if ( ! hasCustomConfigPath && ! configExists ) {
		return defaultConfig;
	}

	const localConfig = await require( absConfigPath );
	return merge( {}, defaultConfig, localConfig );
}

function getPuppeteer( { browser } ) {
	switch ( browser.toLowerCase() ) {
		case 'chromium':
			try {
				return require( 'puppeteer' );
			} catch ( e ) {
				return require( 'puppeteer-core' );
			}
		case 'firefox':
			return require( 'puppeteer-firefox' );
		default:
			throw new Error(
				`Error: "browser" config option is given an unsupported value: ${ browser }`
			);
	}
}

module.exports = {
	readConfig,
	getPuppeteer,
};
