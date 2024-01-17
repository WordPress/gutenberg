/**
 * External dependencies
 */

import Octokit from '@octokit/rest';
import fs from 'fs';

import { fileURLToPath } from 'url';
import nodePath, { dirname } from 'path';

function getArg( argName ) {
	const arg = process.argv.find( ( arg ) =>
		arg.startsWith( `--${ argName }=` )
	);
	return arg ? arg.split( '=' )[ 1 ] : null;
}

const OWNER = 'wordpress';
const REPO = 'gutenberg';

const IGNORED_PATHS = [
	'lib/experiments-page.php',
	'packages/e2e-tests/plugins',
];

const DEBUG = !! getArg( 'debug' );

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );

const authToken = getArg( 'token' );

async function main() {
	if ( ! authToken ) {
		console.error(
			'Error. The --token argument is required. See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token'
		);
		process.exit( 1 );
	}

	const sinceArg = getArg( 'since' );
	let since;

	if ( sinceArg ) {
		if ( validateSince( sinceArg ) ) {
			since = sinceArg;
		} else {
			console.error(
				'Error: The --since argument cannot be more than 2 months from the current date.'
			);
			process.exit( 1 );
		}
	} else {
		console.error(
			`Error. The --since argument is required (e.g. YYYY-MM-DD). This should be the date of the previous release's final RC.`
		);
		process.exit( 1 );
	}

	console.log( 'Welcome to the PHP Sync Issue Generator!' );

	if ( DEBUG ) {
		console.log( 'DEBUG MODE' );
	}

	const octokit = new Octokit( {
		auth: authToken,
	} );

	console.log( '--------------------------------' );
	console.log( '• Running script...' );

	// These should be paths where we expect to find PHP files that
	// will require syncing to WordPress Core. This list should be
	// extremely selective.
	const paths = [ '/lib', '/packages/block-library', '/phpunit' ];

	console.log( `• Fetching all commits made to ${ REPO } since: ${ since }` );
	let commits = await getAllCommitsFromPaths( since, paths );

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
			const commitData = await getCommit( commit.sha );

			// Our Issue links to the PRs associated with the commits so we must
			// provide this data. We could also get the PR data from the commit data,
			// using getPullRequestDataForCommit, but that requires yet another
			// network request. Therefore we optimise for trying to build
			// the PR URL from the commit data we have available.
			const pullRequest = {
				url: buildPRURL( commit ),
				creator: commit?.author?.login || 'unknown',
			};

			if ( pullRequest ) {
				commitData.pullRequest = pullRequest;
			}

			return commitData;
		} )
	);

	const processResult = pipe(
		processCommits,
		removeNesting,
		removeSinglePRLevels,
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

function validateSince( sinceArg ) {
	const maxMonths = 3;

	const sinceDate = new Date( sinceArg );
	const maxPreviousDate = new Date();
	maxPreviousDate.setMonth( maxPreviousDate.getMonth() - maxMonths );

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

	const result = await octokit[ requestType ]( method, params );

	if ( requestType === 'paginate' ) {
		return result;
	}
	return result.data;
}

async function getAllCommitsFromPaths( since, paths ) {
	let commits = [];

	for ( const path of paths ) {
		const pathCommits = await getAllCommits( since, path );
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

function removeSinglePRLevels( data ) {
	function processLevel( levelData, parentData = null, parentKey = null ) {
		const processedData = {};

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( Array.isArray( value ) ) {
				if ( value.length === 1 && parentData && parentKey ) {
					if ( ! Array.isArray( parentData[ parentKey ] ) ) {
						parentData[ parentKey ] = [];
					}
					parentData[ parentKey ] = [
						...parentData[ parentKey ],
						...value,
					];
				} else {
					processedData[ key ] = value;
				}
			} else {
				processedData[ key ] = processLevel(
					value,
					processedData,
					key
				);
			}
		}

		return processedData;
	}

	return processLevel( data );
}

function removeNesting( data, maxLevel = 3 ) {
	function processLevel( levelData, level = 1 ) {
		const processedData = {};

		for ( const [ key, value ] of Object.entries( levelData ) ) {
			if ( Array.isArray( value ) ) {
				processedData[ key ] = value;
			} else if ( level < maxLevel ) {
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

	commits.forEach( ( commit ) => {
		// Skip commits without an associated pull request
		if ( ! commit.pullRequest ) {
			return;
		}
		commit.files.forEach( ( file ) => {
			// Skip files that are not PHP files.
			if ( ! file.filename.endsWith( '.php' ) ) {
				return;
			}

			// Skip files within specific packages.
			if (
				IGNORED_PATHS.some(
					( path ) =>
						file.filename.startsWith( path ) ||
						file.filename === path
				)
			) {
				return;
			}

			const parts = file.filename.split( '/' );
			let current = result;

			// If the file is under 'phpunit', add it directly to the 'phpunit' key
			// this is it's helpful to have a full list of commits that modify tests.
			if ( parts.includes( 'phpunit' ) ) {
				current.phpunit = current.phpunit || [];
				current.phpunit = [ ...current.phpunit, commit ];
				return;
			}

			for ( let i = 0; i < parts.length; i++ ) {
				const part = parts[ i ];

				// Skip 'src' part under 'block-library'
				if ( part === 'src' && parts[ i - 1 ] === 'block-library' ) {
					continue;
				}

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

function formatPRLine( pr ) {
	return `- [ ] ${ pr.url } - @/${ pr.creator } | Trac ticket | Core backport PR\n`;
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
				issueContent += formatPRLine( commit.pullRequest );
			} );
		} else {
			issueContent += generateIssueContent( value, level + 1 );
		}

		isFirstSection = false;
	}

	return issueContent;
}

async function getAllCommits( since, path ) {
	return await octokitPaginate( 'GET /repos/{owner}/{repo}/commits', {
		since,
		per_page: 30,
		path,
	} );
}

async function getCommit( sha ) {
	return octokitRequest( 'GET /repos/{owner}/{repo}/commits/{sha}', {
		sha,
	} );
}

// eslint-disable-next-line no-unused-vars
async function getPullRequestDataForCommit( octokit, commitSha ) {
	const { data: pullRequests } = await octokit.request(
		'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
		{
			owner: OWNER,
			repo: REPO,
			commit_sha: commitSha,
		}
	);

	// If a related Pull Request is found, return its URL and creator
	if ( pullRequests.length > 0 ) {
		const pullRequest = pullRequests[ 0 ];
		return {
			url: pullRequest.html_url,
			creator: pullRequest.user.login,
		};
	}

	return null;
}

const pipe =
	( ...fns ) =>
	( x ) =>
		fns.reduce( ( v, f ) => f( v ), x );

main();
