import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const CODEOWNERS_FILE = '.github/CODEOWNERS';

const INACTIVE_DELAY_IN_MS = 1.577e10; // 6 months

/**
 * Returns true if the username is a GitHub username (i.e. not a team).
 * @param {string} username
 * @return {boolean} Whether the username is a GitHub username.
 */
const isUser = ( username ) => ! username.includes( '/' );

/**
 * Returns the plain username from a GitHub username, without the '@' prefix.
 * @param {string} username
 * @return {string} The plain username.
 */
const getPlainUsername = ( username ) => username.replace( '@', '' );

const content = await readFile( CODEOWNERS_FILE, 'utf-8' );
const codeowners = new Set( content.match( /@\S+/g ) );
const usernames = [ ...codeowners ].filter( isUser ).map( getPlainUsername );

const cutoff = new Date( Date.now() - INACTIVE_DELAY_IN_MS );
const searchDate = cutoff.toISOString().split( 'T' )[ 0 ];

const results = await Promise.all(
	usernames.map( async ( username ) => {
		const result = spawn( 'gh', [
			'pr',
			'list',
			'--search',
			`reviewed-by:${ username } created:>=${ searchDate }`,
			'--state',
			'all',
			'--json',
			'id',
			'--jq',
			'length',
		] );

		let output = '';
		for await ( const chunk of result.stdout ) {
			output += chunk.toString();
		}

		const count = output.trim();
		return count === '0' ? username : null;
	} )
);

console.log( 'Inactive codeowners:' );
console.log( results.filter( Boolean ) );
