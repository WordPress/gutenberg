/**
 * External dependencies
 */
import Diff from 'diff';
import SimpleGit from 'simple-git';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const simpleGit = SimpleGit( dirname( __dirname ) );

async function getCommits( file ) {
	const options = {
		file,
	};
	const log = await simpleGit.log( options );
	return log.all;
}

function matchFilename( file ) {
	if ( file.startsWith( 'lib/compat/wordpress-6.1/' ) ) {
		return file.replace( 'lib/compat/wordpress-6.1/', 'src/wp-includes/' );
	}
	return file;
}

const log = await getCommits( 'lib/compat/wordpress-6.1/' );

const prRegex = /\(#([0-9]+)\)$/;
const prs = log.map( ( { message } ) => message.match( prRegex )?.[ 1 ] );
console.log( prs );

const hash = log[ 1 ].hash;

const diff = await simpleGit.show( hash );

//console.log( diff );

const parsedDiff = Diff.parsePatch( diff );

//console.log( parsedDiff[ 0 ] );

const fileName = parsedDiff[ 0 ].oldFileName.replace( /a\//, '' );

console.log( matchFilename( fileName ) );

parsedDiff[ 0 ].newFileName = 'b/../wordpress-develop/' + matchFilename( fileName );

console.log( parsedDiff );
