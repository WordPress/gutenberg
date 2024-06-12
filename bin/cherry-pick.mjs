/**
 * External dependencies
 */
import fetch from 'node-fetch';
import readline from 'readline';

import { spawnSync } from 'node:child_process';

const LABEL = process.argv[ 2 ] || 'Backport to WP Beta/RC';
const BACKPORT_COMPLETED_LABEL = 'Backported to WP Core';
const BRANCH = getCurrentBranch();
const GITHUB_CLI_AVAILABLE = spawnSync( 'gh', [ 'auth', 'status' ] )
	?.stdout?.toString()
	.includes( '✓ Logged in to github.com' );

const AUTO_PROPAGATE_RESULTS_TO_GITHUB = GITHUB_CLI_AVAILABLE;

/**
 * The main function of this script. It:
 * * Confirms with the developer the current branch aligns with the expectations
 * * Gets local branches in sync with the remote ones
 * * Requests the list of PRs to cherry-pick from GitHub API (closed, label=`Backport to WP Beta/RC`)
 * * Runs `git cherry-pick {commitHash}` for each PR
 * * It keeps track of the failed cherry-picks and then retries them
 * * Retrying keeps going as long as at least one cherry-pick succeeds
 * * Pushes the local branch to `origin`
 * * (optional) Uses the [`gh` console utility](https://cli.github.com/) to comment on the remote PRs and remove the labels
 * * Reports the results
 */
async function main() {
	if ( ! GITHUB_CLI_AVAILABLE ) {
		await reportGhUnavailable();
	}

	console.log( `You are on branch "${ BRANCH }".` );
	console.log( `This script will:` );
	console.log(
		`• Cherry-pick the merged PRs labeled as "${ LABEL }" to this branch`
	);
	console.log( `• Ask whether you want to push this branch` );
	console.log( `• Comment on each PR` );
	console.log( `• Remove the label from each PR` );
	console.log(
		`The last two actions will be performed USING YOUR GITHUB ACCOUNT that`
	);
	console.log( `you've linked to your GitHub CLI (gh command)` );
	console.log( `` );
	await promptDoYouWantToProceed();

	console.log( `$ git pull origin ${ BRANCH } --rebase...` );
	cli( 'git', [ 'pull', 'origin', BRANCH, '--rebase' ], true );

	console.log( `$ git fetch origin trunk...` );
	cli( 'git', [ 'fetch', 'origin', 'trunk' ], true );

	const PRs = await fetchPRs();
	console.log( 'Trying to cherry-pick one by one...' );
	const [ successes, failures ] = cherryPickAll( PRs );
	console.log( 'Cherry-picking finished!' );

	reportSummaryNextSteps( successes, failures );

	if ( successes.length ) {
		if ( AUTO_PROPAGATE_RESULTS_TO_GITHUB ) {
			console.log( `About to push to origin/${ BRANCH }` );
			await promptDoYouWantToProceed();
			cli( 'git', [ 'push', 'origin', BRANCH ] );

			console.log( `Commenting and removing labels...` );
			successes.forEach( GHcommentAndRemoveLabel );
		} else {
			console.log( 'Cherry-picked PRs with copy-able comments:' );
			successes.forEach( reportSuccessManual );
		}
	}
	if ( failures.length ) {
		console.log( 'PRs that could not be cherry-picked automatically:' );
		failures.forEach( reportFailure );
	}
	console.log( `Done!` );
}

/**
 * Synchronously executes a CLI command and returns the result or throws an error on failure.
 *
 * @param {string}   command A command to execute.
 * @param {string[]} args    CLI args.
 * @param {boolean}  pipe    If true, pipes the output to this process's stdout and stderr.
 * @return {string} Command's output.
 */
function cli( command, args, pipe = false ) {
	const pipeOptions = {
		cwd: process.cwd(),
		env: process.env,
		stdio: 'pipe',
		encoding: 'utf-8',
	};
	const result = spawnSync(
		command,
		args,
		...( pipe ? [ pipeOptions ] : [] )
	);
	if ( result.status !== 0 ) {
		throw new Error( result.stderr?.toString()?.trim() );
	}
	return result.stdout.toString().trim();
}

/**
 * Retrieves the details of PR we want to cherry-pick from GitHub API.
 *
 * @return {Promise<Object[]>} A list of relevant PR data objects.
 */
async function fetchPRs() {
	const { items } = await GitHubFetch(
		`/search/issues?per_page=100&q=is:pr state:closed sort:updated label:"${ LABEL }" repo:WordPress/gutenberg`
	);
	const PRs = items
		// eslint-disable-next-line camelcase
		.map( ( { id, number, title, pull_request } ) => ( {
			id,
			number,
			title,
			// eslint-disable-next-line camelcase
			pull_request,
		} ) )
		// eslint-disable-next-line camelcase
		.filter( ( { pull_request } ) => !! pull_request?.merged_at )
		.sort(
			( a, b ) =>
				new Date( a?.pull_request?.merged_at ) -
				new Date( b?.pull_request?.merged_at )
		);

	console.log(
		'Found the following PRs to cherry-pick (sorted by closed date in ascending order): '
	);
	PRs.forEach( ( { number, title } ) =>
		console.log( indent( `#${ number } – ${ title }` ) )
	);
	console.log( 'Fetching commit IDs...' );

	const PRsWithMergeCommit = [];
	for ( const PR of PRs ) {
		const { merge_commit_sha: mergeCommitHash } = await GitHubFetch(
			'/repos/WordPress/Gutenberg/pulls/' + PR.number
		);
		PRsWithMergeCommit.push( {
			...PR,
			mergeCommitHash,
		} );
		if ( ! mergeCommitHash ) {
			throw new Error(
				`Cannot fetch the merge commit sha for ${ prToString( PR ) }`
			);
		}
	}

	console.log( 'Done!' );
	PRsWithMergeCommit.forEach( ( msg ) =>
		console.log( indent( `${ prToString( msg ) }` ) )
	);
	return PRsWithMergeCommit;
}

/**
 * A utility function for GET requesting GitHub API.
 *
 * @param {string} path The API path to request.
 * @return {Promise<Object>} Parsed response JSON.
 */
async function GitHubFetch( path ) {
	const response = await fetch( 'https://api.github.com' + path, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
		},
	} );
	return await response.json();
}

/**
 * Attempts to cherry-pick given PRs using `git` CLI command.
 *
 * Retries failed cherry-picks if any other PR got successfully cherry-picked
 * success since the last attempt.
 *
 * @param {Object[]} PRs The list of PRs to cherry-pick.
 * @return {Array} A two-tuple containing a list of successful cherry-picks and a list of failed ones.
 */
function cherryPickAll( PRs ) {
	let remainingPRs = [ ...PRs ];
	let i = 1;
	let allSuccesses = [];
	while ( remainingPRs.length ) {
		console.log( `Cherry-picking round ${ i++ }: ` );
		const [ successes, failures ] = cherryPickRound( remainingPRs );
		allSuccesses = [ ...allSuccesses, ...successes ];
		remainingPRs = failures;
		if ( ! successes.length ) {
			console.log(
				'Nothing merged cleanly in the last round, breaking.'
			);
			break;
		}
	}
	return [ allSuccesses, remainingPRs ];
}

/**
 * Attempts to cherry-pick given PRs using `git` CLI command.
 *
 * Processes every PR once.
 *
 * @param {Object[]} PRs The list of PRs to cherry-pick.
 * @return {Array} A two-tuple containing a list of successful cherry-picks and a list of failed ones.
 */
function cherryPickRound( PRs ) {
	const stack = [ ...PRs ];
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
					`✅  cherry-pick commit: ${ cherryPickHash }  for PR: ${ prToString(
						PR,
						false
					) }`
				)
			);
		} catch ( e ) {
			failures.push( {
				...PR,
				error: e.toString(),
			} );
			console.log( indent( `❌  ${ prToString( PR ) }` ) );
		}
	}
	return [ successes, failures ];
}

/**
 * Identity function
 *
 * @param {*} x Input.
 * @return {*} Input
 */
const identity = ( x ) => x;

/**
 * Formats a PR object in a human readable way.
 *
 * @param {Object}  PR                  PR details.
 * @param {number}  PR.number
 * @param {string}  PR.mergeCommitHash
 * @param {string}  PR.title
 * @param {boolean} withMergeCommitHash Should include the commit hash in the output?
 * @return {string} Formatted text
 */
function prToString(
	{ number, mergeCommitHash, title },
	withMergeCommitHash = true
) {
	return [
		`#${ number }`,
		withMergeCommitHash ? mergeCommitHash?.substr( 0, 20 ) : '',
		`${ title?.substr( 0, 30 ) }${ title?.length > 30 ? '...' : '' }`,
	]
		.filter( identity )
		.join( ' – ' );
}

/**
 * Indents a block of text with {width} spaces
 *
 * @param {string} text  The text to indent.
 * @param {number} width Number of spaces to use.
 * @return {string} Indented text.
 */
function indent( text, width = 3 ) {
	const _indent = ' '.repeat( width );
	return text
		.split( '\n' )
		.map( ( line ) => _indent + line )
		.join( '\n' );
}

/**
 * Attempts to cherry-pick a given commit into the current branch,
 *
 * @param {string} commit A commit hash.
 * @return {string} Branch name.
 */
function cherryPickOne( commit ) {
	const result = spawnSync( 'git', [ 'cherry-pick', commit ] );
	const message = result.stdout.toString().trim();
	if ( result.status !== 0 || ! message.includes( 'Author: ' ) ) {
		spawnSync( 'git', [ 'reset', '--hard' ] );
		throw new Error( result.stderr.toString().trim() );
	}
	const commitHashOutput = spawnSync( 'git', [
		'rev-parse',
		'--short',
		'HEAD',
	] );
	return commitHashOutput.stdout.toString().trim();
}

/**
 * When the cherry-picking phase is over, this function outputs the stats
 * and informs about the next steps to take.
 *
 * @param {Array} successes Successful cherry-picks.
 * @param {Array} failures  Failed cherry-picks.
 */
function reportSummaryNextSteps( successes, failures ) {
	console.log( 'Summary:' );
	console.log(
		indent( `✅  ${ successes.length } PRs got cherry-picked cleanly` )
	);
	console.log(
		indent(
			`${ failures.length > 0 ? '❌' : '✅' }  ${
				failures.length
			} PRs failed`
		)
	);
	console.log( '' );

	const nextSteps = [];
	if ( successes.length && ! AUTO_PROPAGATE_RESULTS_TO_GITHUB ) {
		nextSteps.push( 'Push this branch' );
		nextSteps.push( 'Go to each of the cherry-picked Pull Requests' );
		nextSteps.push( `Remove the ${ LABEL } label` );

		if ( LABEL === 'Backport to WP Beta/RC' ) {
			nextSteps.push( `Add the "${ BACKPORT_COMPLETED_LABEL }" label` );
		}

		nextSteps.push( 'Request a backport to wordpress-develop if required' );
		nextSteps.push( 'Comment, say that PR just got cherry-picked' );
	}
	if ( failures.length ) {
		nextSteps.push( 'Manually cherry-pick the PRs that failed' );
	}
	if ( nextSteps.length ) {
		console.log( 'Next steps:' );
		for ( let i = 0; i < nextSteps.length; i++ ) {
			console.log( indent( `${ i + 1 }. ${ nextSteps[ i ] }` ) );
		}
		console.log( '' );
	}
}

/**
 * Comment on a given PR to tell the author it's been cherry-picked into a release branch
 * Also, removes the backport label (or any other label used to mark this PR for backporting).
 *
 * Uses the `gh` CLI utility.
 *
 * @param {Object} pr PR details.
 */
function GHcommentAndRemoveLabel( pr ) {
	const { number, cherryPickHash } = pr;
	const comment = prComment( cherryPickHash );
	try {
		cli( 'gh', [ 'pr', 'comment', number, '--body', comment ] );
		cli( 'gh', [ 'pr', 'edit', number, '--remove-label', LABEL ] );

		if ( LABEL === 'Backport to WP Beta/RC' ) {
			cli( 'gh', [
				'pr',
				'edit',
				number,
				'--add-label',
				BACKPORT_COMPLETED_LABEL,
			] );
		}

		console.log( `✅ ${ number }: ${ comment }` );
	} catch ( e ) {
		console.log( `❌ ${ number }. ${ comment } ` );
		console.log( indent( 'Error: ' ) );
		console.error( e );
		console.log( indent( 'You will need to manually process this PR: ' ) );
		reportSuccessManual( pr );
	}
}

/**
 * When cherry-pick succeeds, this function outputs the manual next steps to take.
 *
 * @param {Object} PR                PR details.
 * @param {number} PR.number
 * @param {string} PR.title
 * @param {string} PR.cherryPickHash
 */
function reportSuccessManual( { number, title, cherryPickHash } ) {
	console.log( indent( prUrl( number ) ) );
	console.log( indent( `#${ number } ${ title }` ) );
	console.log( indent( prComment( cherryPickHash ) ) );
	console.log( '' );
}

/**
 * When cherry-pick fails, this function outputs the details.
 *
 * @param {Object} PR                 PR details.
 * @param {number} PR.number
 * @param {string} PR.title
 * @param {string} PR.error
 * @param {string} PR.mergeCommitHash
 */
function reportFailure( { number, title, error, mergeCommitHash } ) {
	console.log( indent( prUrl( number ) ) );
	console.log( indent( `#${ number } ${ title }` ) );
	console.log( indent( `git cherry-pick ${ mergeCommitHash }`, 6 ) );
	console.log( indent( `failed with:`, 6 ) );
	console.log( indent( `${ error }`, 6 ) );
	console.log( '' );
}

/**
 * Returns the URL of the Gutenberg PR given its number.
 *
 * @param {number} number
 * @return {string} PR URL.
 */
function prUrl( number ) {
	return `https://github.com/WordPress/gutenberg/pull/${ number } `;
}

/**
 * Returns the comment informing that a PR was just cherry-picked to the
 * release branch.
 *
 * @param {string} cherryPickHash
 * @return {string} Comment contents.
 */
function prComment( cherryPickHash ) {
	return `I just cherry-picked this PR to the ${ BRANCH } branch to get it included in the next release: ${ cherryPickHash }`;
}

/**
 * Returns the current git branch.
 *
 * @return {string} Branch name.
 */
function getCurrentBranch() {
	return spawnSync( 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ] )
		.stdout.toString()
		.trim();
}

/**
 * Reports when the gh CLI tool is missing, describes the consequences, asks
 * whether to proceed.
 *
 * @return {Promise<void>}
 */
async function reportGhUnavailable() {
	console.log(
		'GitHub CLI is not setup. This script will not be able to automatically'
	);
	console.log(
		'comment on the processed PRs and remove the backport label from them.'
	);
	console.log(
		'Instead, you will see a detailed list of next steps to perform manually.'
	);
	console.log( '' );
	console.log(
		'To enable automatic handling, install the `gh` utility from https://cli.github.com/'
	);
	console.log( '' );
	await promptDoYouWantToProceed();
}

/**
 * Asks a CLI prompt whether the user wants to proceed.
 * Exits if not.
 *
 * @return {Promise<void>}
 */
async function promptDoYouWantToProceed() {
	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );

	const question = ( prompt ) =>
		new Promise( ( resolve ) => rl.question( prompt, resolve ) );
	do {
		const answer = await question( 'Do you want to proceed? (Y/n)' );
		if ( ! answer || answer === 'Y' ) {
			break;
		}
		if ( answer === 'n' ) {
			process.exit( 0 );
		}
	} while ( true );
	rl.close();
}

main();
