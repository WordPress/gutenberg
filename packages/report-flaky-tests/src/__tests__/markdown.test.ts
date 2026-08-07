/**
 * Internal dependencies
 */
import {
	formatTestErrorMessage,
	renderReportComment,
	isReportComment,
} from '../markdown';
import type { ReportedFlakyTest } from '../types';

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

describe( 'renderReportComment', () => {
	it( 'render the report comment', () => {
		const runURL = 'runURL';
		const reportedTests: ReportedFlakyTest[] = [
			{
				testTitle: 'title1',
				testPath: 'path1',
				failedTimes: 1,
				errorMessage: 'Error:\n  Oops...\n',
			},
			{
				testTitle: 'title2',
				testPath: 'path2',
				failedTimes: 2,
			},
		];
		const commitSHA = 'commitSHA';

		const view = renderReportComment( {
			reportedTests,
			runURL,
			commitSHA,
		} );

		expect( view ).toMatchInlineSnapshot( `
		"<!-- flaky-tests-report-comment -->
		**Flaky tests detected in commitSHA.**
		Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

		🔍  Workflow run URL: runURL
		📝  Reported tests:
		<details>
		<summary>title1 in <code>path1</code>, passed after 1 failed attempt.</summary>

		\`\`\`
		Error:
		  Oops...

		\`\`\`

		</details>
		<p>title2 in <code>path2</code>, passed after 2 failed attempts.</p>"
	` );
	} );
} );

describe( 'isReportComment', () => {
	it( 'matches the report comment', () => {
		const view = renderReportComment( {
			reportedTests: [],
			runURL: '',
			commitSHA: 'commitSHA',
		} );

		expect( isReportComment( view ) ).toBe( true );

		expect( isReportComment( 'random string' ) ).toBe( false );
	} );
} );
