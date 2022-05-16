/**
 * External dependencies
 */
import fetch from 'node-fetch';

import { spawnSync } from 'node:child_process';

async function main() {
	const PRs = await fetchPRs();
	console.log( 'Trying to cherry-pick one by one...' );
	const [successes, failures] = cherryPickAll( PRs );
	report( successes, failures );
}

async function fetchPRs() {
	const { items } = await GitHubFetch(
		'/search/issues?q=is:pr state:closed sort:updated label:"Backport to WP Beta/RC" repo:WordPress/gutenberg',
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
	console.log( 'Cherry-picking finished!' );
	console.log( 'Summary:' );
	console.log( indent( `✅  ${ allSuccesses.length } PRs got cherry-picked cleanly` ) );
	console.log( indent( `${ remainingPRs.length > 0 ? '❌' : '✅' }  ${ remainingPRs.length } PRs failed` ) );
	console.log( '' );
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

function report( successes, failures ) {
	const branch = getCurrentBranch();
	console.log( "Next steps:" );
	let n = 1;
	if ( successes.length ) {
		console.log( indent( `${ n ++ }. Push this branch` ) );
		console.log( indent( `${ n ++ }. Go to each of the cherry-picked Pull Requests` ) );
		console.log( indent( `${ n ++ }. Remove the Backport to WP Beta/RC label` ) );
		console.log( indent( `${ n ++ }. Request a backport to wordpress-develop if required` ) );
		console.log( indent( `${ n ++ }. Comment, say that PR just got cherry-picked` ) );
	}
	if ( failures.length ) {
		console.log( indent( `${ n ++ }. Manually cherry-pick the PRs that failed` ) );
	}
	console.log( '' );
	if ( successes.length ) {
		console.log( "Cherry-picked PRs with copy-able comments:" );
		for ( const { number, title, cherryPickHash } of successes ) {
			console.log( indent( `https://github.com/WordPress/gutenberg/pull/${ number } ` ) );
			console.log( indent( `#${ number } ${ title }` ) );
			console.log( '' );
			console.log(
				indent(
					`I just cherry-picked this PR to the ${ branch } branch to get it included in the next release: ${ cherryPickHash }` ) );
			console.log( '' );
		}
		// gh pr comment:
		// https://cli.github.com/manual/gh_pr_comment
		// Also remove the label
	}
	if ( failures.length ) {
		console.log( "PRs that could not be cherry-picked automatically:" );
		console.log( '' );
		for ( const { number, title, mergeCommitHash, error } of failures ) {
			console.log( indent( `https://github.com/WordPress/gutenberg/pulls/${ number } ` ) );
			console.log( indent( `#${ number } ${ title }` ) );
			console.log( indent( `git cherry-pick ${ mergeCommitHash }`, 6 ) );
			console.log( indent( `failed with:`, 6 ) );
			console.log( indent( `${ error }`, 6 ) );
			console.log( '' );
		}
	}
	console.log( `Done!` );
}

function getCurrentBranch() {
	return spawnSync( 'git', ['rev-parse', '--abbrev-ref', 'HEAD'] ).stdout.toString();
}

main();
