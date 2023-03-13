/**
 * External dependencies
 */
import path from 'path';
import { formatResultsErrors } from 'jest-message-util';
import * as core from '@actions/core';

/**
 * Internal dependencies
 */
import { stripAnsi } from './strip-ansi';
import type { MetaData, FlakyTestResult, ReportedIssue } from './types';

type ParsedTestResult = {
	date: Date;
	failedTimes: number;
	runURL: string;
	headBranch: string;
	errorMessage?: string;
};

const TEST_RESULTS_LIST = {
	open: `<!-- __TEST_RESULTS_LIST__ -->`,
	close: `<!-- /__TEST_RESULTS_LIST__ -->`,
};
const TEST_RESULT = {
	open: '<!-- __TEST_RESULT__ -->',
	close: '<!-- /__TEST_RESULT__ -->',
};

const metaData = {
	render: ( json: MetaData ) =>
		`<!-- __META_DATA__:${ JSON.stringify( json ) } -->`,
	get: ( str: string ): MetaData | undefined => {
		const matched = str.match( /<!-- __META_DATA__:(.*) -->/ );
		try {
			if ( matched ) {
				return JSON.parse( matched[ 1 ] );
			}
		} catch ( error ) {
			// Ignore errors.
		}
		return undefined;
	},
};

const TEST_LOG_REGEX = new RegExp(
	`<time datetime="(?<date>.+)">.*</time>\\s*Test passed after (?<failedTimes>\\d) failed attempts? on <a href="(?<runURL>.+)"><code>(?<headBranch>.+)</code></a>\\.`
);
const TEST_FULL_REGEX = new RegExp(
	`(?:<details>\\s*<summary>\\s*)?${ TEST_LOG_REGEX.source }(?:\\s*</summary>\\s*
\`\`\`
(?<errorMessage>[\\s\\S]*)
\`\`\`
\\s*</details>)?`
);

function renderIssueBody( {
	meta,
	testTitle,
	testPath,
	formattedTestResults,
}: {
	meta: MetaData;
	testTitle: string;
	testPath: string;
	formattedTestResults: string;
} ) {
	return `${ metaData.render( meta ) }
**Flaky test detected. This is an auto-generated issue by GitHub Actions. Please do NOT edit this manually.**

## Test title
${ testTitle }

## Test path
\`${ testPath }\`

## Errors
${ TEST_RESULTS_LIST.open }
${ formattedTestResults }
${ TEST_RESULTS_LIST.close }
`;
}

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

function formatTestResults( {
	date,
	failedTimes,
	headBranch,
	runURL,
	errorMessage,
}: ParsedTestResult ) {
	const dateString = date.toISOString();

	// It will look something like this without formatting:
	// [2021-08-31T16:15:19.875Z] Test passed after 2 failed attempts on trunk.
	const log = `<time datetime="${ dateString }"><code>[${ dateString }]</code></time> Test passed after ${ failedTimes } failed ${
		failedTimes === 1 ? 'attempt' : 'attempts'
	} on <a href="${ runURL }"><code>${ headBranch }</code></a>.`;

	if ( ! errorMessage ) {
		return `${ TEST_RESULT.open }${ log }${ TEST_RESULT.close }`;
	}

	return `${ TEST_RESULT.open }<details>
<summary>
	${ log }
</summary>

\`\`\`
${ errorMessage }
\`\`\`
</details>${ TEST_RESULT.close }`;
}

function parseFormattedTestResults(
	formattedTestResults: string
): ParsedTestResult {
	const matches = formattedTestResults
		// Unify line breaks.
		.replace( /\r\n/g, '\n' )
		.match( TEST_FULL_REGEX );

	if ( ! matches ) {
		throw new Error( `Unable to parse the test results:
${ formattedTestResults }` );
	}

	const { date, failedTimes, runURL, headBranch, errorMessage } =
		matches.groups!;

	return {
		date: new Date( date ),
		failedTimes: parseInt( failedTimes, 10 ),
		runURL,
		headBranch,
		errorMessage,
	};
}

function parseIssueBody( body: string ) {
	const meta = metaData.get( body );

	if ( ! meta ) {
		throw new Error( 'Unable to parse meta data from issue.' );
	}

	const testResults = Array.from(
		body.matchAll(
			new RegExp(
				`^${ TEST_RESULT.open }[\\s\\S]+?${ TEST_RESULT.close }$`,
				'gm'
			)
		)
	)
		.map( ( [ match ] ) => match )
		.map( ( testResult ) => {
			try {
				return parseFormattedTestResults( testResult );
			} catch ( error ) {
				core.error( error as Error );
				return undefined;
			}
		} )
		.filter(
			( testResult ): testResult is ParsedTestResult =>
				testResult !== undefined
		);

	return {
		meta,
		testResults,
	};
}

const FLAKY_TESTS_REPORT_COMMENT_TOKEN = `flaky-tests-report-comment`;

function renderCommitComment( {
	reportedIssues,
	runURL,
	commitSHA,
}: {
	reportedIssues: ReportedIssue[];
	runURL: string;
	commitSHA: string;
} ) {
	return `<!-- ${ FLAKY_TESTS_REPORT_COMMENT_TOKEN } -->
**Flaky tests detected in ${ commitSHA }.**
Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

🔍  Workflow run URL: ${ runURL }
📝  Reported issues:
${ reportedIssues
	.map( ( issue ) => `- #${ issue.issueNumber } in \`${ issue.testPath }\`` )
	.join( '\n' ) }`;
}

function isReportComment( body: string ) {
	return body.startsWith( `<!-- ${ FLAKY_TESTS_REPORT_COMMENT_TOKEN } -->` );
}

export {
	renderIssueBody,
	formatTestErrorMessage,
	formatTestResults,
	parseFormattedTestResults,
	parseIssueBody,
	renderCommitComment,
	isReportComment,
};
