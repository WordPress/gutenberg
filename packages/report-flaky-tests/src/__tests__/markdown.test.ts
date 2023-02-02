/**
 * External dependencies
 */
import * as core from '@actions/core';

/**
 * Internal dependencies
 */
import {
	formatTestErrorMessage,
	formatTestResults,
	renderIssueBody,
	parseFormattedTestResults,
	parseIssueBody,
	renderCommitComment,
	isReportComment,
} from '../markdown';
import { ReportedIssue } from '../types';

jest.useFakeTimers( 'modern' ).setSystemTime( new Date( '2020-05-10' ) );

jest.spyOn( core, 'error' ).mockImplementation( () => {} );

describe( 'formatTestErrorMessage', () => {
	it( 'should format test error message for jest-circus', async () => {
		const { default: flakyTest } = await import(
			'../__fixtures__/Should insert new template part on creation.json'
		);

		const formatted = formatTestErrorMessage( flakyTest as any );

		expect( formatted ).toMatchSnapshot();
	} );

	it( 'should format test error message for @playwright/test', async () => {
		const { default: flakyTest } = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		);

		const formatted = formatTestErrorMessage( flakyTest as any );

		expect( formatted ).toMatchSnapshot();
	} );
} );

describe( 'formatTestResults', () => {
	it( 'should format flaky test results without error messages', () => {
		const formatted = formatTestResults( {
			date: new Date(),
			failedTimes: 1,
			headBranch: 'trunk',
			runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2282393879',
		} );

		expect( formatted ).toMatchInlineSnapshot(
			`"<!-- __TEST_RESULT__ --><time datetime=\\"2020-05-10T00:00:00.000Z\\"><code>[2020-05-10T00:00:00.000Z]</code></time> Test passed after 1 failed attempt on <a href=\\"https://github.com/WordPress/gutenberg/actions/runs/2282393879\\"><code>trunk</code></a>.<!-- /__TEST_RESULT__ -->"`
		);

		expect( renderToDisplayText( formatted ) ).toMatchInlineSnapshot(
			`"[2020-05-10T00:00:00.000Z] Test passed after 1 failed attempt on trunk."`
		);
	} );

	it( 'should format flaky test results with error messages', () => {
		const formatted = formatTestResults( {
			date: new Date(),
			failedTimes: 1,
			headBranch: 'trunk',
			runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2282393879',
			errorMessage: 'Error:\n  Oops...\n',
		} );

		expect( formatted ).toMatchInlineSnapshot( `
		"<!-- __TEST_RESULT__ --><details>
		<summary>
			<time datetime=\\"2020-05-10T00:00:00.000Z\\"><code>[2020-05-10T00:00:00.000Z]</code></time> Test passed after 1 failed attempt on <a href=\\"https://github.com/WordPress/gutenberg/actions/runs/2282393879\\"><code>trunk</code></a>.
		</summary>

		\`\`\`
		Error:
		  Oops...

		\`\`\`
		</details><!-- /__TEST_RESULT__ -->"
	` );
	} );
} );

describe( 'renderIssueBody', () => {
	it( 'should render issue body', () => {
		const meta = {
			failedTimes: 5,
			totalCommits: 100,
		};

		const body = renderIssueBody( {
			meta,
			testTitle: 'Test title',
			testPath: 'test/e2e/specs/test-title.spec.js',
			formattedTestResults: 'FORMATTED_TEST_RESULTS',
		} );

		expect( body ).toMatchInlineSnapshot( `
		"<!-- __META_DATA__:{\\"failedTimes\\":5,\\"totalCommits\\":100} -->
		**Flaky test detected. This is an auto-generated issue by GitHub Actions. Please do NOT edit this manually.**

		## Test title
		Test title

		## Test path
		\`test/e2e/specs/test-title.spec.js\`

		## Errors
		<!-- __TEST_RESULTS_LIST__ -->
		FORMATTED_TEST_RESULTS
		<!-- /__TEST_RESULTS_LIST__ -->
		"
	` );
	} );
} );

describe( 'parseFormattedTestResults', () => {
	it( 'should parse formatted test results without error messages', () => {
		const testResult = {
			date: new Date(),
			failedTimes: 1,
			headBranch: 'trunk',
			runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2297863316',
		};

		const formatted = formatTestResults( testResult );

		const parsed = parseFormattedTestResults( formatted );

		expect( parsed ).toEqual( testResult );
	} );

	it( 'should parse formatted test results with error messages', () => {
		const testResult = {
			date: new Date(),
			failedTimes: 1,
			headBranch: 'trunk',
			runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2297863316',
			errorMessage: 'Error:\n  Oops...\n',
		};

		const formatted = formatTestResults( testResult );

		const parsed = parseFormattedTestResults( formatted );

		expect( parsed ).toEqual( testResult );
	} );

	it( 'should handle GitHub converted line breaks (\r\n) in the result', () => {
		const testResult = {
			date: new Date(),
			failedTimes: 1,
			headBranch: 'trunk',
			runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2297863316',
			errorMessage: 'Error:\n  Oops...\n',
		};

		const formatted = formatTestResults( testResult ).replace(
			/\n/g,
			'\r\n'
		);

		const parsed = parseFormattedTestResults( formatted );

		expect( parsed ).toEqual( testResult );
	} );
} );

describe( 'parseIssueBody', () => {
	it( 'should parse issue body', async () => {
		const testResults = [
			formatTestResults( {
				date: new Date( '2020-08-01' ),
				failedTimes: 1,
				headBranch: 'trunk',
				runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2282393879',
			} ),
			formatTestResults( {
				date: new Date(),
				failedTimes: 2,
				headBranch: 'try/some-branch',
				runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2297863316',
				errorMessage: 'Error:\n  Oops...\n  Oops again',
			} ),
			`\n<!-- __TEST_RESULT__ -->Some broken log.\nOops.\n<!-- /__TEST_RESULT__ -->\n`,
		];

		const meta = {
			failedTimes: 5,
			totalCommits: 95,
		};

		const body = renderIssueBody( {
			meta,
			testTitle: 'Test title',
			testPath: 'test/e2e/specs/test-title.spec.js',
			formattedTestResults: testResults.join( '\n' ),
		} );

		expect( body ).toMatchSnapshot();

		const parsed = parseIssueBody( body );

		expect( core.error ).toHaveBeenCalledTimes( 1 );

		expect( parsed ).toEqual( {
			meta,
			testResults: [
				{
					date: new Date( '2020-08-01' ),
					failedTimes: 1,
					headBranch: 'trunk',
					runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2282393879',
				},
				{
					date: new Date(),
					failedTimes: 2,
					headBranch: 'try/some-branch',
					runURL: 'https://github.com/WordPress/gutenberg/actions/runs/2297863316',
					errorMessage: 'Error:\n  Oops...\n  Oops again',
				},
			],
		} );
	} );
} );

describe( 'renderCommitComment', () => {
	it( 'render the commit comment', () => {
		const runURL = 'runURL';
		const reportedIssues: ReportedIssue[] = [
			{
				testTitle: 'title1',
				testPath: 'path1',
				issueNumber: 1,
				issueUrl: 'url1',
			},
			{
				testTitle: 'title2',
				testPath: 'path2',
				issueNumber: 2,
				issueUrl: 'url2',
			},
		];
		const commitSHA = 'commitSHA';

		const commentBody = renderCommitComment( {
			reportedIssues,
			runURL,
			commitSHA,
		} );

		expect( commentBody ).toMatchInlineSnapshot( `
		"<!-- flaky-tests-report-comment -->
		**Flaky tests detected in commitSHA.**
		Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

		🔍  Workflow run URL: runURL
		📝  Reported issues:
		- #1 in \`path1\`
		- #2 in \`path2\`"
	` );
	} );
} );

describe( 'isReportComment', () => {
	it( 'matches the report comment', () => {
		const commentBody = renderCommitComment( {
			reportedIssues: [],
			runURL: '',
			commitSHA: 'commitSHA',
		} );

		expect( isReportComment( commentBody ) ).toBe( true );

		expect( isReportComment( 'random string' ) ).toBe( false );
	} );
} );

function renderToDisplayText( html: string ) {
	const container = document.createElement( 'div' );
	container.innerHTML = html;
	return container.textContent!.replace( /\s+/g, ' ' );
}
