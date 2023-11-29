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
const {
	setup: setupServer,
	teardown: teardownServer,
	ERROR_TIMEOUT,
	ERROR_NO_COMMAND,
} = require( 'jest-dev-server' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { readConfig, getPuppeteer } = require( './config' );

let browser;
let didAlreadyRunInWatchMode = false;
let servers = [];

async function setup( jestConfig = {} ) {
	const config = await readConfig();
	const puppeteer = getPuppeteer( config );
	if ( config.connect ) {
		browser = await puppeteer.connect( config.connect );
	} else {
		browser = await puppeteer.launch( config.launch );
	}
	process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint();

	// If we are in watch mode, - only setupServer() once.
	if ( jestConfig.watch || jestConfig.watchAll ) {
		if ( didAlreadyRunInWatchMode ) return;
		didAlreadyRunInWatchMode = true;
	}

	if ( config.server ) {
		try {
			servers = await setupServer( config.server );
		} catch ( error ) {
			const { error: printError } = console;
			if ( error.code === ERROR_TIMEOUT ) {
				printError( '' );
				printError( chalk.red( error.message ) );
				printError(
					chalk.blue(
						`\n☝️ You can set "server.launchTimeout" in jest-puppeteer.config.js`
					)
				);
				process.exit( 1 );
			}
			if ( error.code === ERROR_NO_COMMAND ) {
				printError( '' );
				printError( chalk.red( error.message ) );
				printError(
					chalk.blue(
						`\n☝️ You must set "server.command" in jest-puppeteer.config.js`
					)
				);
				process.exit( 1 );
			}
			throw error;
		}
	}
}

async function teardown( jestConfig = {} ) {
	const config = await readConfig();

	if ( config.connect ) {
		await browser.disconnect();
	} else {
		await browser.close();
	}

	if ( ! jestConfig.watch && ! jestConfig.watchAll ) {
		await teardownServer( servers );
	}
}

module.exports = {
	setup,
	teardown,
};
