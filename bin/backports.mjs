/**
 * External dependencies
 */
import SimpleGit from 'simple-git';
import { dirname, join as pathJoin } from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const simpleGit = SimpleGit( dirname( __dirname ) );

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

backportDirectories.forEach( async ( backportDir ) => {
	console.log( `### ${ backportDir }\n` );
	const files = await fsPromises.readdir( backportDir );
	for ( const file of files ) {
		const path = pathJoin( backportDir, file );
		const stat = await fsPromises.stat( path );
		if ( ! stat.isFile() ) {
			continue;
		}

		console.log( `- ${ file }` );
		const log = await getCommits( path );

		const prs = log.map(
			( { message } ) => message.match( prRegex )?.[ 1 ]
		);
		prs.forEach( ( pr ) => {
			console.log( `  - #${ pr }` );
		} );
	}
} );
