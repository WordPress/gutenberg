import path from 'path';
import { formatResultsErrors } from 'jest-message-util';
import { stripAnsi } from './strip-ansi.ts';
import type { FlakyTestResult, ReportedFlakyTest } from './types.ts';

function formatTestErrorMessage( flakyTestResult: FlakyTestResult ) {
	switch ( flakyTestResult.runner ) {
		case '@playwright/test': {
			// Could do a slightly better formatting than this.
			return stripAnsi(
				flakyTestResult.results
					.map( ( result ) => result!.error!.stack )
					.join( '\n' )
			);
		}
		case 'jest-circus':
		default: {
			return stripAnsi(
				formatResultsErrors(
					flakyTestResult.results,
					{
						rootDir: path.join(
							process.cwd(),
							'packages/e2e-tests'
						),
						// This is useless just to make typescript happy.
						testMatch: [],
					},
					{ noStackTrace: false },
					flakyTestResult.path
				)!
			);
		}
	}
}

function renderReportedTest( {
	testTitle,
	testPath,
	failedTimes,
	errorMessage,
}: ReportedFlakyTest ) {
	const summary = `${ testTitle } in <code>${ testPath }</code>, passed after ${ failedTimes } failed ${
		failedTimes === 1 ? 'attempt' : 'attempts'
	}.`;

	if ( ! errorMessage ) {
		return `<p>${ summary }</p>`;
	}

	return `<details>
<summary>${ summary }</summary>

\`\`\`
${ errorMessage }
\`\`\`

</details>`;
}

function renderReport( {
	reportedTests,
}: {
	reportedTests: ReportedFlakyTest[];
} ) {
	return `Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

${ reportedTests.map( renderReportedTest ).join( '\n' ) }`;
}

export { formatTestErrorMessage, renderReport };
