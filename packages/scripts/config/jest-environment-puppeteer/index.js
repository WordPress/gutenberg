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
const path = require( 'path' );
const { writeFile, mkdir } = require( 'fs' ).promises;
const filenamify = require( 'filenamify' );
const NodeEnvironment = require( 'jest-environment-node' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { readConfig, getPuppeteer } = require( './config' );

const handleError = ( error ) => {
	// To match the same behavior in jest-jasmine2:
	// https://github.com/facebook/jest/blob/1be8d737abd0e2f30e3314184a0efc372ad6d88f/packages/jest-jasmine2/src/jasmine/Env.ts#L250-L251
	// Emitting an uncaughtException event to the process will throw an
	// empty error which is very hard to debug in puppeteer context.
	// eslint-disable-next-line no-console
	console.error( error );
};

const KEYS = {
	CONTROL_C: '\u0003',
	CONTROL_D: '\u0004',
	ENTER: '\r',
};

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const ARTIFACTS_PATH = path.resolve(
	root,
	process.env.WP_ARTIFACTS_PATH || 'artifacts'
);

class PuppeteerEnvironment extends NodeEnvironment {
	// Jest is not available here, so we have to reverse engineer
	// the setTimeout function, see https://github.com/facebook/jest/blob/v23.1.0/packages/jest-runtime/src/index.js#L823
	setTimeout( timeout ) {
		if ( this.global.jasmine ) {
			this.global.jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
		} else {
			this.global[ Symbol.for( 'TEST_TIMEOUT_SYMBOL' ) ] = timeout;
		}
	}

	async setup() {
		const config = await readConfig();
		const puppeteer = getPuppeteer( config );
		this.global.puppeteerConfig = config;

		const wsEndpoint = process.env.PUPPETEER_WS_ENDPOINT;
		if ( ! wsEndpoint ) {
			throw new Error( 'wsEndpoint not found' );
		}

		this.global.jestPuppeteer = {
			debug: async () => {
				// Set timeout to 4 days.
				this.setTimeout( 345600000 );
				// Run a debugger (in case Puppeteer has been launched with `{ devtools: true }`)
				await this.global.page.evaluate( () => {
					// eslint-disable-next-line no-debugger
					debugger;
				} );
				// eslint-disable-next-line no-console
				console.log(
					chalk.blue(
						'\n\n🕵️‍  Code is paused, press enter to resume'
					)
				);
				// Run an infinite promise.
				return new Promise( ( resolve ) => {
					const { stdin } = process;
					const onKeyPress = ( key ) => {
						if (
							key === KEYS.CONTROL_C ||
							key === KEYS.CONTROL_D ||
							key === KEYS.ENTER
						) {
							stdin.removeListener( 'data', onKeyPress );
							if ( ! listening ) {
								if ( stdin.isTTY ) {
									stdin.setRawMode( false );
								}
								stdin.pause();
							}
							resolve();
						}
					};
					const listening = stdin.listenerCount( 'data' ) > 0;
					if ( ! listening ) {
						if ( stdin.isTTY ) {
							stdin.setRawMode( true );
						}
						stdin.resume();
						stdin.setEncoding( 'utf8' );
					}
					stdin.on( 'data', onKeyPress );
				} );
			},
			resetPage: async () => {
				if ( this.global.page ) {
					this.global.page.removeListener( 'pageerror', handleError );
					await this.global.page.close();
				}

				this.global.page = await this.global.context.newPage();
				if ( config && config.exitOnPageError ) {
					this.global.page.addListener( 'pageerror', handleError );
				}
			},
			resetBrowser: async () => {
				if ( this.global.page ) {
					this.global.page.removeListener( 'pageerror', handleError );
				}
				if (
					config.browserContext === 'incognito' &&
					this.global.context
				) {
					await this.global.context.close();
				} else if ( this.global.page ) {
					await this.global.page.close();
				}
				this.global.page = null;

				if ( this.global.browser ) {
					await this.global.browser.disconnect();
				}

				this.global.browser = await puppeteer.connect( {
					...config.connect,
					...config.launch,
					browserURL: undefined,
					browserWSEndpoint: wsEndpoint,
				} );

				if ( config.browserContext === 'incognito' ) {
					// Using this, pages will be created in a pristine context.
					this.global.context = await this.global.browser.createIncognitoBrowserContext();
				} else if (
					config.browserContext === 'default' ||
					! config.browserContext
				) {
					/**
					 * Since this is a new browser, browserContexts() will return only one instance
					 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#browserbrowsercontexts
					 */
					this.global.context = await this.global.browser.browserContexts()[ 0 ];
				} else {
					throw new Error(
						`browserContext should be either 'incognito' or 'default'. Received '${ config.browserContext }'`
					);
				}
				await this.global.jestPuppeteer.resetPage();
			},
		};

		await this.global.jestPuppeteer.resetBrowser();

		try {
			await mkdir( ARTIFACTS_PATH, { recursive: true } );
		} catch ( err ) {
			if ( err.code !== 'EEXIST' ) {
				throw err;
			}
		}
	}

	async teardown() {
		const { page, context, browser, puppeteerConfig } = this.global;

		if ( page ) {
			page.removeListener( 'pageerror', handleError );
		}

		if ( puppeteerConfig.browserContext === 'incognito' ) {
			if ( context ) {
				await context.close();
			}
		} else if ( page ) {
			await page.close();
		}

		if ( browser ) {
			await browser.disconnect();
		}
	}

	async storeArtifacts( testName ) {
		const datetime = new Date().toISOString().split( '.' )[ 0 ];
		const fileName = filenamify( `${ testName } ${ datetime }`, {
			replacement: '-',
		} );
		await writeFile(
			path.join( ARTIFACTS_PATH, `${ fileName }-snapshot.html` ),
			await this.global.page.content()
		);
		await this.global.page.screenshot( {
			path: path.join( ARTIFACTS_PATH, `${ fileName }.jpg` ),
		} );
	}

	async handleTestEvent( event, state ) {
		if ( event.name === 'test_fn_failure' ) {
			const testName = state.currentlyRunningTest.name;
			await this.storeArtifacts( testName );
		}
	}
}

module.exports = PuppeteerEnvironment;
