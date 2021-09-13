/**
 * External dependencies
 */
const path = require( 'path' );
const github = require( '@actions/github' );
const core = require( '@actions/core' );
const unzipper = require( 'unzipper' );
const { formatResultsErrors } = require( 'jest-message-util' );

const TEST_RESULTS_LIST = {
	open: `<!-- __TEST_RESULTS_LIST__ -->`,
	close: `<!-- /__TEST_RESULTS_LIST__ -->`,
};
const TEST_RESULT = {
	open: '<!-- __TEST_RESULT__ -->',
	close: '<!-- /__TEST_RESULT__ -->',
};

const metaData = {
	render: ( json ) => `<!-- __META_DATA__:${ JSON.stringify( json ) } -->`,
	get: ( str ) => {
		const matched = str.match( /<!-- __META_DATA__:(.*) -->/ );
		if ( matched ) {
			return JSON.parse( matched[ 1 ] );
		}
	},
};

( async function run() {
	const token = core.getInput( 'repo-token', { required: true } );
	const label = core.getInput( 'label', { required: true } );
	const artifactName = core.getInput( 'artifact-name', { required: true } );

	const octokit = github.getOctokit( token );

	const flakyTests = await downloadReportFromArtifact(
		octokit,
		artifactName
	);

	if ( ! flakyTests ) {
		return;
	}

	const issues = await fetchAllIssuesLabeledFlaky( octokit, label );

	for ( const flakyTest of flakyTests ) {
		const {
			title: testTitle,
			path: testPath,
			results: testResults,
		} = flakyTest;
		const issueTitle = getIssueTitle( testTitle );
		const reportedIssue = issues.find(
			( issue ) => issue.title === issueTitle
		);
		const isTrunk = getHeadBranch() === 'trunk';
		let issue;

		if ( reportedIssue ) {
			let body = reportedIssue.body;
			const meta = metaData.get( body );

			if ( isTrunk ) {
				const headCommit = github.context.sha;
				const baseCommit = meta.baseCommit || github.context.sha;

				try {
					const { data } = await octokit.rest.repos.compareCommits( {
						...github.context.repo,
						base: baseCommit,
						head: headCommit,
						per_page: 1,
					} );

					meta.failedTimes += testResults.length;
					meta.totalCommits = data.total_commits + 1;
				} catch ( err ) {
					// It might be a deleted commit,
					// treat the current commit as the base commit.
					meta.baseCommit = headCommit;
					meta.failedTimes = testResults.length;
					meta.totalCommits = 1;
				}
			}

			// Reconstruct the body with the description + previous errors + new error.
			body =
				renderIssueDescription( { meta, testTitle, testPath } ) +
				body.slice(
					body.indexOf( TEST_RESULTS_LIST.open ),
					body.indexOf( TEST_RESULTS_LIST.close )
				) +
				[
					renderTestErrorMessage( { testPath, testResults } ),
					TEST_RESULTS_LIST.close,
				].join( '\n' );

			const response = await octokit.rest.issues.update( {
				...github.context.repo,
				issue_number: reportedIssue.number,
				state: 'open',
				body,
			} );

			issue = response.data;
		} else {
			const meta = isTrunk
				? {
						failedTimes: testResults.length,
						totalCommits: 1,
						baseCommit: github.context.sha,
				  }
				: {
						failedTimes: 0,
						totalCommits: 0,
				  };

			const response = await octokit.rest.issues.create( {
				...github.context.repo,
				title: issueTitle,
				body: renderIssueBody( {
					meta,
					testTitle,
					testPath,
					testResults,
				} ),
				labels: [ label ],
			} );

			issue = response.data;
		}

		core.info( `Reported flaky test to ${ issue.html_url }` );
	}
} )().catch( ( err ) => {
	core.error( err );
} );

async function fetchAllIssuesLabeledFlaky( octokit, label ) {
	const issues = await octokit.paginate( 'GET /repos/{owner}/{repo}/issues', {
		...github.context.repo,
		state: 'all',
		labels: label,
	} );

	return issues;
}

async function downloadReportFromArtifact( octokit, artifactName ) {
	const {
		data: { artifacts },
	} = await octokit.rest.actions.listWorkflowRunArtifacts( {
		...github.context.repo,
		run_id: github.context.payload.workflow_run.id,
	} );

	const matchArtifact = artifacts.find(
		( artifact ) => artifact.name === artifactName
	);

	if ( ! matchArtifact ) {
		// No flaky tests reported in this run.
		return;
	}

	const download = await octokit.rest.actions.downloadArtifact( {
		...github.context.repo,
		artifact_id: matchArtifact.id,
		archive_format: 'zip',
	} );

	const { files } = await unzipper.Open.buffer(
		Buffer.from( download.data )
	);
	const fileBuffers = await Promise.all(
		files.map( ( file ) => file.buffer() )
	);
	const parsedFiles = fileBuffers.map( ( buffer ) =>
		JSON.parse( buffer.toString() )
	);

	return parsedFiles;
}

function getIssueTitle( testTitle ) {
	return `[Flaky Test] ${ testTitle }`;
}

function renderIssueBody( { meta, testTitle, testPath, testResults } ) {
	return (
		renderIssueDescription( { meta, testTitle, testPath } ) +
		renderTestResults( { testPath, testResults } )
	);
}

function renderIssueDescription( { meta, testTitle, testPath } ) {
	return `${ metaData.render( meta ) }
**Flaky test detected. This is an auto-generated issue by GitHub Actions. Please do NOT edit this manually.**

## Test title
${ testTitle }

## Test path
\`${ testPath }\`

## Flaky rate (_estimated_)
\`${ meta.failedTimes } / ${ meta.totalCommits + meta.failedTimes }\` runs

## Errors
`;
}

function renderTestResults( { testPath, testResults } ) {
	return `${ TEST_RESULTS_LIST.open }
${ renderTestErrorMessage( { testPath, testResults } ) }
${ TEST_RESULTS_LIST.close }
`;
}

function renderTestErrorMessage( { testPath, testResults } ) {
	const date = new Date().toISOString();
	// It will look something like this without formatting:
	// ▶ [2021-08-31T16:15:19.875Z] Test passed after 2 failed attempts on trunk
	return `${ TEST_RESULT.open }<details>
<summary>
	<time datetime="${ date }"><code>[${ date }]</code></time>
		Test passed after ${ testResults.length } failed ${
		testResults.length === 0 ? 'attempt' : 'attempts'
	} on <a href="${ getRunURL() }"><code>${ getHeadBranch() }</code></a>.
</summary>

\`\`\`
${ stripAnsi(
	formatResultsErrors(
		testResults,
		{ rootDir: path.join( process.cwd(), 'packages/e2e-tests' ) },
		{},
		testPath
	)
) }
\`\`\`
</details>${ TEST_RESULT.close }`;
}

function getHeadBranch() {
	return github.context.payload.workflow_run.head_branch;
}

function getRunURL() {
	return github.context.payload.workflow_run.html_url;
}

/**
 * Copied pasted from `strip-ansi` to use without ESM.
 * @see https://github.com/chalk/strip-ansi
 * Licensed under MIT license.
 */
function stripAnsi( string ) {
	return string.replace(
		new RegExp(
			[
				'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
				'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
			].join( '|' ),
			'g'
		)
	);
}
