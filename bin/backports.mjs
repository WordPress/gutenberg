/**
 * External dependencies
 */
import SimpleGit from 'simple-git';
import { dirname, join as pathJoin } from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import Octokit from '@octokit/rest';

/**
 * Internal dependencies
 */
import { getPreviousMajorVersion } from './plugin/lib/version.js';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const simpleGit = SimpleGit( dirname( __dirname ) );
const octokit = new Octokit();

const wpVersion = '6.1';
const previousWpVersion = getPreviousMajorVersion( wpVersion ).replace(
	/\.0$/,
	''
);

async function getCommits( file ) {
	const options = {
		file,
		from: `wp/${ previousWpVersion }`,
		to: 'HEAD',
	};
	const log = await simpleGit.log( options );
	return log.all;
}

const prRegex = /\(#([0-9]+)\)$/;
const ghTreeRoot = 'https://github.com/WordPress/gutenberg/tree/trunk/';
const ghCommitsRoot = 'https://github.com/WordPress/gutenberg/commits/trunk/';
const backportDirectories = [
	'lib/block-supports/',
	`lib/compat/wordpress-${ wpVersion }/`,
	'lib/experimental/',
];

for ( const backportDir of backportDirectories ) {
	console.log( `### [${ backportDir }](${ ghTreeRoot }${ backportDir })\n` );
	const files = await fsPromises.readdir( backportDir );
	for ( const file of files ) {
		const path = pathJoin( backportDir, file );
		const stat = await fsPromises.stat( path );
		if ( ! stat.isFile() ) {
			continue;
		}

		console.log( `- [${ file }](${ ghCommitsRoot }${ path })` );
		const log = await getCommits( path );

		const prNumbers = log.map(
			( { message } ) => message.match( prRegex )?.[ 1 ]
		);

		const authors = new Set();
		for ( const prNumber of prNumbers ) {
			if ( ! prNumber ) {
				continue;
			}
			const pr = await octokit.pulls.get( {
				owner: 'WordPress',
				repo: 'gutenberg',
				pull_number: prNumber,
			} );
			authors.add( pr.data.user.login );
			console.log( `  - #${ prNumber }` );
		}

		const byline = [ ...authors ]
			.map( ( author ) => `@${ author }` )
			.join( ' ' );
		console.log( byline );
	}
}
