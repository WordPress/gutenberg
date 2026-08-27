import * as fs from 'fs/promises';
import * as path from 'path';
import * as github from '@actions/github';
import * as core from '@actions/core';
import type { PullRequestEvent } from '@octokit/webhooks-types';
import { GitHubAPI } from './github-api.ts';
import {
	formatTestErrorMessage,
	renderReportComment,
	isReportComment,
} from './markdown.ts';
import type { FlakyTestResult, ReportedFlakyTest } from './types.ts';

async function run() {
	// Flaky tests are only reported on pull requests. The workflow already
	// filters other events out, so this is a safety net for reuse elsewhere.
	if ( github.context.eventName !== 'pull_request' ) {
		core.info(
			`Flaky tests are only reported on pull requests, skipping the "${ github.context.eventName }" event.`
		);
		return;
	}

	const token = core.getInput( 'repo-token', { required: true } );
	const artifactPath = core.getInput( 'artifact-path', {
		required: true,
	} );

	const { runId: runID, repo } = github.context;
	// Cast the payload type: https://github.com/actions/toolkit/tree/main/packages/github#webhook-payload-typescript-definitions
	const payload = github.context.payload as PullRequestEvent;
	const runURL = `https://github.com/${ repo.owner }/${ repo.repo }/actions/runs/${ runID }`;
	const api = new GitHubAPI( token, repo );

	const flakyTestsDir = await fs.readdir( artifactPath );
	const flakyTests: FlakyTestResult[] = await Promise.all(
		flakyTestsDir.map( ( filename ) =>
			fs
				.readFile( path.join( artifactPath, filename ), 'utf-8' )
				.then( ( text ) => JSON.parse( text ) )
		)
	);

	if ( ! flakyTests || flakyTests.length === 0 ) {
		// No flaky tests reported in this run.
		return;
	}

	const reportedTests: ReportedFlakyTest[] = flakyTests.map(
		( flakyTest ) => ( {
			testTitle: flakyTest.title,
			testPath: flakyTest.path.startsWith( process.cwd() )
				? flakyTest.path.slice( process.cwd().length )
				: flakyTest.path,
			failedTimes: flakyTest.results.length,
			errorMessage: formatTestErrorMessage( flakyTest ),
		} )
	);

	const { html_url: commentUrl } = await api.createCommentOnPR(
		payload.number,
		renderReportComment( {
			runURL,
			reportedTests,
			commitSHA: payload.pull_request.head.sha,
		} ),
		isReportComment
	);

	core.info( `Reported the summary of the flaky tests to ${ commentUrl }` );
}

export { run };
