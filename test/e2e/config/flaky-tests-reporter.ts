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
import fs from 'fs';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import filenamify from 'filenamify';

type FormattedTestResult = Omit< TestResult, 'steps' >;

// Remove "steps" to prevent stringify circular structure.
function formatTestResult( testResult: TestResult ): FormattedTestResult {
	const result = { ...testResult, steps: undefined };
	delete result.steps;
	return result;
}

class FlakyTestsReporter implements Reporter {
	failingTestCaseResults = new Map< string, FormattedTestResult[] >();

	onBegin() {
		try {
			fs.mkdirSync( 'flaky-tests' );
		} catch ( err ) {
			if (
				err instanceof Error &&
				( err as NodeJS.ErrnoException ).code === 'EEXIST'
			) {
				// Ignore the error if the directory already exists.
			} else {
				throw err;
			}
		}
	}

	onTestEnd( test: TestCase, testCaseResult: TestResult ) {
		const testPath = test.location.file;
		const testTitle = test.title;

		switch ( test.outcome() ) {
			case 'unexpected': {
				if ( ! this.failingTestCaseResults.has( testTitle ) ) {
					this.failingTestCaseResults.set( testTitle, [] );
				}
				this.failingTestCaseResults
					.get( testTitle )!
					.push( formatTestResult( testCaseResult ) );
				break;
			}
			case 'flaky': {
				fs.writeFileSync(
					`flaky-tests/${ filenamify( testTitle ) }.json`,
					JSON.stringify( {
						runner: '@playwright/test',
						title: testTitle,
						path: testPath,
						results: this.failingTestCaseResults.get( testTitle ),
					} ),
					'utf-8'
				);
				break;
			}
			default:
				break;
		}
	}

	onEnd() {
		this.failingTestCaseResults.clear();
	}

	printsToStdio() {
		return false;
	}
}

module.exports = FlakyTestsReporter;
