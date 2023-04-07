/**
 * External dependencies
 */
import * as github from '@actions/github';
import * as core from '@actions/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { PullRequestEvent } from '@octokit/webhooks-types';

/**
 * Internal dependencies
 */
import { GitHubAPI } from './github-api';
import {
	renderIssueBody,
	formatTestErrorMessage,
	formatTestResults,
	parseIssueBody,
	renderCommitComment,
	isReportComment,
} from './markdown';
import type { ReportedIssue } from './types';

async function run() {
	const token = core.getInput( 'repo-token', { required: true } );
	const artifactPath = core.getInput( 'artifact-path', {
		required: true,
	} );

	const { runId: runID, repo, ref } = github.context;
	const runURL = `https://github.com/${ repo.owner }/${ repo.repo }/actions/runs/${ runID }`;
	const api = new GitHubAPI( token, repo );

	const flakyTestsDir = await fs.readdir( artifactPath );
	const flakyTests = await Promise.all(
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

	const headBranch =
		github.context.eventName === 'pull_request'
			? // Cast the payload type: https://github.com/actions/toolkit/tree/main/packages/github#webhook-payload-typescript-definitions
			  ( github.context.payload as PullRequestEvent ).pull_request.head
					.ref
			: ref.replace( /^refs\/(heads|tag)\//, '' );

	const label = core.getInput( 'label', { required: true } );
	const issues = await api.fetchAllIssuesLabeledFlaky( label );
	const reportedIssues: ReportedIssue[] = [];

	for ( const flakyTest of flakyTests ) {
		const { title: testTitle } = flakyTest;
		const issueTitle = getIssueTitle( testTitle );
		const reportedIssue = issues.find(
			( issue ) => issue.title === issueTitle
		);
		const testPath = flakyTest.path.startsWith( process.cwd() )
			? flakyTest.path.slice( process.cwd().length )
			: flakyTest.path;
		let issue;

		const currentFormattedTestResults = formatTestResults( {
			date: new Date(),
			failedTimes: flakyTest.results.length,
			headBranch,
			runURL,
			// Always output the latest test results' stacks.
			errorMessage: formatTestErrorMessage( flakyTest ),
		} );

		if ( reportedIssue ) {
			const body = reportedIssue.body!;

			// The issue is closed.
			if ( reportedIssue.closed_at ) {
				try {
					// Represent the latest base commit on trunk.
					const latestAncestorCommit = await api.findMergeBaseCommit(
						'trunk',
						github.context.sha
					);
					const latestAncestorDate =
						latestAncestorCommit.committer?.date;

					// Cannot find the commit date, skipping.
					if ( ! latestAncestorDate ) {
						return;
					}

					// The issue is closed after the latest base commit on trunk,
					// which means the branch/PR/commit is outdated and the flaky test
					// has probably already been fixed. Skip reporting the outdated flaky tests.
					if (
						new Date( reportedIssue.closed_at ) >=
						new Date( latestAncestorDate )
					) {
						return;
					}
				} catch ( error ) {
					// It might be a deleted commit or something else.
					core.error(
						error instanceof Error ? error : String( error )
					);
					return;
				}
			}

			const { meta, testResults: prevTestResults } =
				parseIssueBody( body );

			// Concat the test results list with the latest test results.
			const formattedTestResults = [
				...prevTestResults.map( ( testResult ) =>
					formatTestResults( {
						...testResult,
						// Don't output previous test results' stacks.
						errorMessage: undefined,
					} )
				),
				currentFormattedTestResults,
			].join( '\n<br/>\n' );

			issue = await api.updateIssue( {
				issue_number: reportedIssue.number,
				state: 'open',
				body: renderIssueBody( {
					meta,
					testTitle,
					testPath,
					formattedTestResults,
				} ),
			} );
		} else {
			issue = await api.createIssue( {
				title: issueTitle,
				body: renderIssueBody( {
					meta: {},
					testTitle,
					testPath,
					formattedTestResults: currentFormattedTestResults,
				} ),
				labels: [ label ],
			} );
		}

		reportedIssues.push( {
			testTitle,
			testPath,
			issueNumber: issue.number,
			issueUrl: issue.html_url,
		} );
		core.info( `Reported flaky test to ${ issue.html_url }` );
	}

	if ( reportedIssues.length === 0 ) {
		return;
	}

	const { html_url: commentUrl } =
		github.context.eventName === 'pull_request'
			? await api.createCommentOnPR(
					// Cast the payload type: https://github.com/actions/toolkit/tree/main/packages/github#webhook-payload-typescript-definitions
					( github.context.payload as PullRequestEvent ).number,
					renderCommitComment( {
						runURL,
						reportedIssues,
						commitSHA: (
							github.context.payload as PullRequestEvent
						 ).pull_request.head.sha,
					} ),
					isReportComment
			  )
			: await api.createCommentOnCommit(
					github.context.sha,
					renderCommitComment( {
						runURL,
						reportedIssues,
						commitSHA: github.context.sha,
					} ),
					isReportComment
			  );

	core.info( `Reported the summary of the flaky tests to ${ commentUrl }` );
}

function getIssueTitle( testTitle: string ) {
	return `[Flaky Test] ${ testTitle }`;
}

export { run };
