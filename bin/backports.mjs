/**
 * External dependencies
 */
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

const log = await getCommits( 'lib/compat/wordpress-6.1/' );

const prRegex = /\(#([0-9]+)\)$/;
const prs = log.map( ( { message } ) => message.match( prRegex )?.[ 1 ] );
console.log( prs );


