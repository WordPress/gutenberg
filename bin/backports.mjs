/**
 * External dependencies
 */
import SimpleGit from 'simple-git';
import { dirname, join as pathJoin } from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import Octokit from '@octokit/rest';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const simpleGit = SimpleGit( dirname( __dirname ) );

const octokit = new Octokit();

async function getCommits( file ) {
	const options = {
		file,
	};
	const log = await simpleGit.log( options );
	return log.all;
}

const prRegex = /\(#([0-9]+)\)$/;
const ghRoot = 'https://github.com/WordPress/gutenberg/commits/trunk/';
const backportDirectories = [
	'lib/block-supports/',
	'lib/compat/wordpress-6.1/',
];

for ( const backportDir of backportDirectories ) {
	console.log( `### ${ backportDir }\n` );
	const files = await fsPromises.readdir( backportDir );
	for ( const file of files ) {
		const path = pathJoin( backportDir, file );
		const stat = await fsPromises.stat( path );
		if ( ! stat.isFile() ) {
			continue;
		}

		console.log( `- [${ file }](${ ghRoot }${ path })` );
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
