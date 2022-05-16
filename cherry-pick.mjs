/**
 * External dependencies
 */
import fetch from 'node-fetch';

import { spawnSync } from 'node:child_process';

const LABEL = "Backport to WP Beta/RC";
const BRANCH = getCurrentBranch();
const GITHUB_CLI_AVAILABLE = spawnSync( 'gh', ['auth', 'status'] )
	?.stderr
	?.toString()
	.includes( '✓ Logged in to github.com as' );
if ( !GITHUB_CLI_AVAILABLE ) {
	// communicate the situation
	// ask the user whether to proceed
	// add a CLI option to explicitly disable the automatic GitHub handling
	// add a CLI option to disable user interactions for CI use
	// add a CLI option to override the label
}
const AUTO_PROPAGATE_RESULTS_TO_GITHUB = GITHUB_CLI_AVAILABLE;

async function main() {
	console.log( `Running git pull origin ${ BRANCH } --rebase...` );
	spawnSync( 'git', ['pull', 'origin', BRANCH, '--rebase'], {
		cwd: process.cwd(),
		env: process.env,
		stdio: 'pipe',
		encoding: 'utf-8',
	} );

	const PRs = await fetchPRs();
	console.log( 'Trying to cherry-pick one by one...' );
	const [successes, failures] = cherryPickAll( PRs );

	console.log( 'Cherry-picking finished!' );
	reportSummaryNextSteps( successes, failures );

	if ( successes.length ) {
		if ( AUTO_PROPAGATE_RESULTS_TO_GITHUB ) {
			console.log( `Pushing to origin/${ BRANCH }` );
			cli( 'git', ['push', 'origin', BRANCH] );

			console.log( `Commenting and removing labels...` );
			successes.forEach( GHcommentAndRemoveLabel );
		} else {
			console.log( "Cherry-picked PRs with copy-able comments:" );
			successes.forEach( reportSuccessManual );
		}
	}
	if ( failures.length ) {
		console.log( "PRs that could not be cherry-picked automatically:" );
		failures.forEach( reportFailure );
	}
	console.log( `Done!` );
}

function cli( command, args ) {
	const result = spawnSync( command, args );
	if ( result.status !== 0 ) {
		throw new Error( result.stderr?.toString()?.trim() );
	}
	return result.stdout.toString().trim();
}

async function fetchPRs() {
	const { items } = await GitHubFetch(
		`/search/issues?q=is:pr state:closed sort:updated label:"${ LABEL }" repo:WordPress/gutenberg`,
	);
	const PRs = items.map( ( { id, number, title } ) => ( { id, number, title } ) );
	console.log( 'Found the following PRs to cherry-pick: ' );
	PRs.forEach( ( { number, title } ) => console.log( indent( `#${ number } – ${ title }` ) ) );
	console.log( 'Fetching commit IDs...' );

	const PRsWithMergeCommit = [];
	for ( const PR of PRs ) {
		const { merge_commit_sha } = await GitHubFetch(
			'/repos/WordPress/Gutenberg/pulls/' + PR.number,
		);
		PRsWithMergeCommit.push( {
			...PR,
			mergeCommitHash: merge_commit_sha,
		} );
		if ( !merge_commit_sha ) {
			throw new Error( `Cannot fetch the merge commit sha for ${ prToString( PR ) }` );
		}
	}

	console.log( 'Done!' );
	PRsWithMergeCommit
		.forEach( ( msg ) => console.log( indent( `${ prToString( msg ) }` ) ) );
	return PRsWithMergeCommit;
}

async function GitHubFetch( path ) {
	const response = await fetch(
		'https://api.github.com' + path,
		{
			headers: {
				Accept: 'application/vnd.github.v3+json',
			},
		},
	);
	return await response.json();
}

function cherryPickAll( PRs ) {
	let remainingPRs = [...PRs];
	let i = 1;
	let allSuccesses = [];
	while ( remainingPRs.length ) {
		console.log( `Cherry-picking round ${ i ++ }: ` );
		const [successes, failures] = cherryPickRound( remainingPRs );
		allSuccesses = [...allSuccesses, ...successes];
		remainingPRs = failures;
		if ( !successes.length ) {
			console.log( 'Nothing merged cleanly in the last round, breaking.' );
			break;
		}
	}
	return [allSuccesses, remainingPRs];
}

function cherryPickRound( PRs ) {
	const stack = [...PRs];
	const successes = [];
	const failures = [];
	while ( stack.length ) {
		const PR = stack.shift();
		try {
			const cherryPickHash = cherryPickOne( PR.mergeCommitHash );
			successes.push( {
				...PR,
				cherryPickHash,
			} );
			console.log(
				indent(
					`✅  cherry-pick commit: ${ cherryPickHash }  for PR: ${ prToString( PR, false ) }` ) );
		} catch ( e ) {
			failures.push( {
				...PR,
				error: e.toString(),
			} );
			console.log( indent( `❌  ${ prToString( PR ) }` ) );
		}
	}
	return [successes, failures];
}

const identity = x => x;

function prToString( { number, mergeCommitHash, title }, withMergeCommitHash = true ) {
	return [
		`#${ number }`,
		withMergeCommitHash ? mergeCommitHash?.substr( 0, 20 ) : '',
		`${ title?.substr( 0, 30 ) }${ title?.length > 30 ? '...' : '' }`,
	].filter( identity ).join( ' – ' );
}

function indent( text, width = 3 ) {
	const indent = ' '.repeat( width );
	return text.split( "\n" ).map( line => indent + line ).join( "\n" );
}

function cherryPickOne( commit ) {
	const result = spawnSync( 'git', ['cherry-pick', commit] );
	const message = result.stdout.toString().trim();
	if ( result.status !== 0 || !message.includes( 'Author: ' ) ) {
		spawnSync( 'git', ['reset', '--hard'] );
		throw new Error( result.stderr.toString().trim() );
	}
	const commitHashOutput = spawnSync( 'git', ['rev-parse', '--short', 'HEAD'] );
	return commitHashOutput.stdout.toString().trim();
}

function reportSummaryNextSteps( successes, failures ) {
	console.log( 'Summary:' );
	console.log( indent( `✅  ${ successes.length } PRs got cherry-picked cleanly` ) );
	console.log(
		indent( `${ failures.length > 0 ? '❌' : '✅' }  ${ failures.length } PRs failed` ) );
	console.log( '' );

	const nextSteps = [];
	if ( successes.length && !AUTO_PROPAGATE_RESULTS_TO_GITHUB ) {
		nextSteps.push( 'Push this branch' );
		nextSteps.push( 'Go to each of the cherry-picked Pull Requests' );
		nextSteps.push( 'Remove the Backport to WP Beta/RC label' );
		nextSteps.push( 'Request a backport to wordpress-develop if required' );
		nextSteps.push( 'Comment, say that PR just got cherry-picked' );
	}
	if ( failures.length ) {
		nextSteps.push( 'Manually cherry-pick the PRs that failed' );
	}
	if ( nextSteps.length ) {
		console.log( "Next steps:" );
		for ( let i = 0; i < nextSteps.length; i ++ ) {
			console.log( indent( `${ i + 1 }. ${ nextSteps[ i ] }` ) );
		}
		console.log( '' );
	}
}

function GHcommentAndRemoveLabel( pr ) {
	const { number, cherryPickHash } = pr;
	const comment = prComment( cherryPickHash );
	try {
		cli( 'gh', ['pr', 'comment', number, comment] );
		cli( 'gh', ['pr', 'edit', number, '--remove-label', LABEL] );
		console.log( `✅ ${ number }: ${ comment }` );
	} catch ( e ) {
		console.log( `❌ ${ number }. ${ comment } ` );
		console.log( indent( 'Error: ' ) );
		console.error( e );
		console.log( indent( 'You will need to manually process this PR: ' ) );
		reportSuccessManual( pr );
	}
}

function reportSuccessManual( { number, cherryPickHash } ) {
	console.log( indent( prUrl( number ) ) );
	console.log( indent( `#${ number } ${ title }` ) );
	console.log( indent( prComment( cherryPickHash ) ) );
	console.log( '' );
}

function reportFailure( { number, mergeCommitHash } ) {
	console.log( indent( prUrl( number ) ) );
	console.log( indent( `#${ number } ${ title }` ) );
	console.log( indent( `git cherry-pick ${ mergeCommitHash }`, 6 ) );
	console.log( indent( `failed with:`, 6 ) );
	console.log( indent( `${ error }`, 6 ) );
	console.log( '' );
}

function prUrl( number ) {
	return `https://github.com/WordPress/gutenberg/pull/${ number } `;
}

function prComment( cherryPickHash ) {
	return `I just cherry-picked this PR to the ${ BRANCH } branch to get it included in the next release: ${ cherryPickHash }`;
}

function getCurrentBranch() {
	return spawnSync( 'git', ['rev-parse', '--abbrev-ref', 'HEAD'] ).stdout.toString();
}

main();
