/**
 * External dependencies
 */

import Octokit from '@octokit/rest';
import fs from 'fs';

import { fileURLToPath } from 'url';
import nodePath, { dirname } from 'path';

function getArg( argName ) {
	const arg = process.argv.find( ( _arg ) =>
		_arg.startsWith( `--${ argName }=` )
	);
	return arg ? arg.split( '=' )[ 1 ] : null;
}

const OWNER = 'wordpress';
const REPO = 'gutenberg';
const MAX_MONTHS_TO_QUERY = 4;

// The following paths will be ignored when generating the issue content.
const IGNORED_PATHS = [
	'init.php', // plugin specific code.
	'lib/load.php', // plugin specific code.
	'lib/experiments-page.php', // experiments are plugin specific.
	'packages/e2e-tests/plugins', // PHP files related to e2e tests only.
	'packages/block-library', // packages are synced to WP Core via npm packages.
];

// PRs containing the following labels will be ignored when generating the issue content.
const LABELS_TO_IGNORE = [
	'Backport from WordPress Core', // PRs made "upstream" in Core that were synced back into Gutenberg.
	'Backported to WP Core', // PRs that were synced into Core during a previous release.
];

const MAX_NESTING_LEVEL = 3;

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );

const authToken = getArg( 'token' );
const stableWPRelease = getArg( 'wpstable' );

async function main() {
	if ( ! authToken ) {
		console.error(
			'Error. The --token argument is required. See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token'
		);
		process.exit( 1 );
	}

	if ( ! stableWPRelease ) {
		console.error(
			'Error. The --wpstable argument is required. It should be the current stable WordPress release (e.g. 6.4).'
		);
		process.exit( 1 );
	}

	const sinceArg = getArg( 'since' );
	let since;

	if ( sinceArg ) {
		if ( validateDate( sinceArg ) ) {
			since = sinceArg;
		} else {
			console.error(
				`Error: The --since argument cannot be more than ${ MAX_MONTHS_TO_QUERY } months from the current date.`
			);
			process.exit( 1 );
		}
	} else {
		console.error(
			`Error. The --since argument is required (e.g. YYYY-MM-DD). This should be the date of the final Gutenberg release that was included in the last stable WP Core release (see https://developer.wordpress.org/block-editor/contributors/versions-in-wordpress/).`
		);
		process.exit( 1 );
	}

	console.log( 'Welcome to the PHP Sync Issue Generator!' );

	console.log( '--------------------------------' );
	console.log( '• Running script...' );

	// These should be paths where we expect to find PHP files that
	// will require syncing to WordPress Core. This list should be
	// extremely selective.
	const paths = [ '/lib', '/phpunit' ];

	console.log( `• Fetching all commits made to ${ REPO } since: ${ since }` );
	let commits = await fetchAllCommitsFromPaths( since, paths );

	// Remove identical commits based on sha
	commits = commits.reduce( ( acc, current ) => {
		const x = acc.find( ( item ) => item.sha === current.sha );
		if ( ! x ) {
			return acc.concat( [ current ] );
		}
		return acc;
	}, [] );

	// Fetch the full commit data for each of the commits.
	// This is because the /commits endpoint does not include the
	// information about the `files` modified in the commit.
	console.log(
		`• Fetching full commit data for ${ commits.length } commits`
	);
	const commitsWithCommitData = await Promise.all(
		commits.map( async ( commit ) => {
			const commitData = await fetchCommit( commit.sha );

			const fullPRData = await getPullRequestDataForCommit( commit.sha );

			// Our Issue links to the PRs associated with the commits so we must
			// provide this data. We could also get the PR data from the commit data,
			// using getPullRequestDataForCommit, but that requires yet another
			// network request. Therefore we optimise for trying to build
			// the PR URL from the commit data we have available.
			commitData.pullRequest = {
				url: fullPRData?.html_url || buildPRURL( commit ),
				creator:
					fullPRData?.user?.login ||
					commit?.author?.login ||
					'unknown',
				labels: fullPRData?.labels || [],
			};

			// if the PR labels contain any of the labels to ignore, skip this commit
			// by returning null.
			if (
				commitData.pullRequest.labels.some( ( label ) =>
					LABELS_TO_IGNORE.includes( label.name )
				)
			) {
				return null;
			}

			return commitData;
		} )
	);

	const processResult = pipe(
		processCommits,
		reduceNesting,
		dedupePRsPerLevel,
		removeEmptyLevels,
		sortLevels
	);

	console.log( `• Processing ${ commitsWithCommitData.length } commits` );
	const result = processResult( commitsWithCommitData );

	console.log( `• Generating Issue content` );
	const content = generateIssueContent( result );

	// Write the Markdown content to a file
	fs.writeFileSync( nodePath.join( __dirname, 'issueContent.md' ), content );
}

/**
 * Checks if the first date is after the second date.
 *
 * @param {string} date1 - The first date.
 * @param {string} date2 - The second date.
 * @return {boolean} - Returns true if the first date is after the second date, false otherwise.
 */
function isAfter( date1, date2 ) {
	return new Date( date1 ) > new Date( date2 );
}

function validateDate( sinceArg ) {
	const sinceDate = new Date( sinceArg );
	const maxPreviousDate = new Date();
	maxPreviousDate.setMonth(
		maxPreviousDate.getMonth() - MAX_MONTHS_TO_QUERY
	);

	return sinceDate >= maxPreviousDate;
}

async function octokitPaginate( method, params ) {
	return octokitRequest( method, params, { paginate: true } );
}

async function octokitRequest( method = '', params = {}, settings = {} ) {
	const octokit = new Octokit( { auth: authToken } );
	params.owner = OWNER;
	params.repo = REPO;

	const requestType = settings?.paginate ? 'paginate' : 'request';

	try {
		const result = await octokit[ requestType ]( method, params );

		if ( requestType === 'paginate' ) {
			return result;
		}
		return result.data;
	} catch ( error ) {
		console.error(
			`Error making request to ${ method }: ${ error.message }`
		);
		process.exit( 1 );
	}
}

async function fetchAllCommitsFromPaths( since, paths ) {
	let commits = [];

	for ( const path of paths ) {
		const pathCommits = await fetchAllCommits( since, path );
		commits = [ ...commits, ...pathCommits ];
	}

	return commits;
}

function buildPRURL( commit ) {
	const prIdMatch = commit.commit.message.match( /\(#(\d+)\)/ );
	const prId = prIdMatch ? prIdMatch[ 1 ] : null;
	return prId
		? `https://github.com/WordPress/gutenberg/pull/${ prId }`
		: `[Commit](${ commit.html_url })`;
}

function sortLevels( data ) {
	function processLevel( levelData ) {
		const processedData = {};

		// Separate directories and files
		const directories = {};
		const files = {};

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( key.endsWith( '.php' ) ) {
				files[ key ] = Array.isArray( value )
					? value
					: processLevel( value );
			} else {
				directories[ key ] = Array.isArray( value )
					? value
					: processLevel( value );
			}
		}

		// Combine directories and files
		Object.assign( processedData, directories, files );

		return processedData;
	}

	return processLevel( data );
}

function removeEmptyLevels( data ) {
	function processLevel( levelData ) {
		const processedData = {};

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( Array.isArray( value ) ) {
				if ( value.length > 0 ) {
					processedData[ key ] = value;
				}
			} else {
				const processedLevel = processLevel( value );
				if ( Object.keys( processedLevel ).length > 0 ) {
					processedData[ key ] = processedLevel;
				}
			}
		}

		return processedData;
	}

	return processLevel( data );
}

function dedupePRsPerLevel( data ) {
	function processLevel( levelData ) {
		const processedData = {};
		const prSet = new Set();

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( Array.isArray( value ) ) {
				processedData[ key ] = value.filter( ( commit ) => {
					if ( ! prSet.has( commit.pullRequest.url ) ) {
						prSet.add( commit.pullRequest.url );
						return true;
					}
					return false;
				} );
			} else {
				processedData[ key ] = processLevel( value );
			}
		}

		return processedData;
	}

	return processLevel( data );
}

function reduceNesting( data ) {
	function processLevel( levelData, level = 1 ) {
		const processedData = {};

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( Array.isArray( value ) ) {
				processedData[ key ] = value;
			} else if ( level < MAX_NESTING_LEVEL ) {
				processedData[ key ] = processLevel( value, level + 1 );
			} else {
				processedData[ key ] = flattenData( value );
			}
		}

		return processedData;
	}

	function flattenData( nestedData ) {
		let flatData = [];

		for ( const value of Object.values( nestedData ) ) {
			if ( Array.isArray( value ) ) {
				flatData = [ ...flatData, ...value ];
			} else {
				flatData = [ ...flatData, ...flattenData( value ) ];
			}
		}

		return flatData;
	}

	return processLevel( data );
}

function processCommits( commits ) {
	const result = {};

	// This dir sholud be ignored, since whatever is in there is already in core.
	// It exists to provide compatibility for older releases, because we have to
	// support the current and the previous WP versions.
	// See: https://github.com/WordPress/gutenberg/pull/57890#pullrequestreview-1828994247.
	const prevReleaseCompatDirToIgnore = `lib/compat/wordpress-${ stableWPRelease }`;

	commits.forEach( ( commit ) => {
		// Skip commits without an associated pull request
		if ( ! commit?.pullRequest ) {
			return;
		}
		commit.files.forEach( ( file ) => {
			// Skip files that are not PHP files.
			if ( ! file.filename.endsWith( '.php' ) ) {
				return;
			}

			if (
				[ ...IGNORED_PATHS, prevReleaseCompatDirToIgnore ].some(
					( path ) =>
						file.filename.startsWith( path ) ||
						file.filename === path
				)
			) {
				// Skip files within specific packages.
				return;
			}

			const parts = file.filename.split( '/' );

			let current = result;

			// If the file is under 'phpunit', always add it to the 'phpunit' key
			// as it's helpful to have a full list of commits that modify tests.
			if ( parts.includes( 'phpunit' ) ) {
				current.phpunit = current.phpunit || [];
				current.phpunit = [ ...current.phpunit, commit ];
			}

			for ( let i = 0; i < parts.length; i++ ) {
				const part = parts[ i ];

				if ( i === parts.length - 1 ) {
					current[ part ] = current[ part ] || [];
					current[ part ] = [ ...current[ part ], commit ];
				} else {
					current[ part ] = current[ part ] || {};
					current = current[ part ];
				}
			}
		} );
	} );

	return result;
}

function formatPRLine( { pullRequest: pr } ) {
	return `- [ ] ${ pr.url } - @${ pr.creator } | Trac ticket | Core backport PR \n`;
}

function formatHeading( level, key ) {
	const emoji = key.endsWith( '.php' ) ? '📄' : '📁';
	return `${ '#'.repeat( level ) } ${ emoji } ${ key }\n\n`;
}

function generateIssueContent( result, level = 1 ) {
	let issueContent = '';
	let isFirstSection = true;

	for ( const [ key, value ] of Object.entries( result ) ) {
		// Add horizontal rule divider between sections, but not before the first section
		if ( level <= 2 && ! isFirstSection ) {
			issueContent += '\n---\n';
		}

		issueContent += formatHeading( level, key );

		if ( Array.isArray( value ) ) {
			value.forEach( ( commit ) => {
				issueContent += formatPRLine( commit );
			} );
		} else {
			issueContent += generateIssueContent( value, level + 1 );
		}

		isFirstSection = false;
	}

	return issueContent;
}

async function fetchAllCommits( since, path ) {
	return octokitPaginate( 'GET /repos/{owner}/{repo}/commits', {
		since,
		per_page: 30,
		path,
	} );
}

async function fetchCommit( sha ) {
	return octokitRequest( 'GET /repos/{owner}/{repo}/commits/{sha}', {
		sha,
	} );
}

// eslint-disable-next-line no-unused-vars
async function getPullRequestDataForCommit( commitSha ) {
	const pullRequests = await octokitRequest(
		'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
		{
			commit_sha: commitSha,
		}
	);

	// If a related Pull Request is found, return its URL and creator
	if ( pullRequests.length > 0 ) {
		const pullRequest = pullRequests[ 0 ];
		return pullRequest;
	}

	return null;
}

const pipe =
	( ...fns ) =>
	( x ) =>
		fns.reduce( ( v, f ) => f( v ), x );

main();
