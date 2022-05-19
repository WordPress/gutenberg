/**
 * A **flaky** test is defined as a test which passed after auto-retrying.
 * - By default, all tests run once if they pass.
 * - If a test fails, it will automatically re-run at most 2 times.
 * - If it pass after retrying (below 2 times), then it's marked as **flaky**
 *   but displayed as **passed** in the original test suite.
 * - If it fail all 3 times, then it's a **failed** test.
 */
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { formatResultsErrors } = require( 'jest-message-util' );
const filenamify = require( 'filenamify' );

class FlakyTestsReporter {
	constructor( globalConfig, options ) {
		this._globalConfig = globalConfig;
		this._options = options;

		this.failingTestCaseResults = new Map();
	}

	async onRunStart() {
		try {
			fs.mkdir( 'flaky-tests' );
		} catch ( err ) {
			// Ignore the error if the directory already exists.
			if ( err.code !== 'EEXIST' ) {
				throw err;
			}
		}
	}

	async onTestCaseResult( test, testCaseResult ) {
		const testPath = path.relative( this._globalConfig.rootDir, test.path );
		const testTitle = testCaseResult.title;

		switch ( testCaseResult.status ) {
			case 'failed': {
				if ( ! this.failingTestCaseResults.has( testTitle ) ) {
					this.failingTestCaseResults.set( testTitle, [] );
				}
				this.failingTestCaseResults
					.get( testTitle )
					.push( testCaseResult );
				break;
			}
			case 'passed': {
				if ( this.failingTestCaseResults.has( testTitle ) ) {
					const failingResults = this.failingTestCaseResults.get(
						testTitle
					);

					await fs.writeFile(
						`flaky-tests/${ filenamify( testTitle ) }.json`,
						JSON.stringify( {
							runner: 'jest-circus',
							title: testTitle,
							path: testPath,
							results: failingResults,
						} ),
						'utf-8'
					);

					// Don't silence flaky error messages for debugging reason.
					// eslint-disable-next-line no-console
					console.error(
						`Test passed after ${ failingResults.length } failed ${
							failingResults.length === 1 ? 'attempt' : 'attempts'
						}:`
					);
					// eslint-disable-next-line no-console
					console.error(
						formatResultsErrors(
							failingResults,
							this._globalConfig,
							{},
							test.path
						)
					);
				}
				break;
			}
			default:
				break;
		}
	}

	onRunComplete() {
		this.failingTestCaseResults.clear();
	}
}

module.exports = FlakyTestsReporter;
