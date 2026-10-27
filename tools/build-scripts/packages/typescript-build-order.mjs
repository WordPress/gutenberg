/**
 * Lists the TypeScript projects in the order `tsc --build` builds them.
 *
 * Building them one at a time in separate processes, in this order, keeps
 * peak memory to that of the largest project: each process reads the
 * declaration files emitted by earlier ones instead of their sources.
 */

/**
 * External dependencies
 */
import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

/**
 * Removes comments and trailing commas from a JSONC string, leaving string
 * literals untouched.
 *
 * @param {string} text JSONC source.
 * @return {string} JSON source.
 */
function stripJsonComments( text ) {
	let result = '';
	let inString = false;
	for ( let i = 0; i < text.length; i++ ) {
		const char = text[ i ];
		const next = text[ i + 1 ];
		if ( inString ) {
			result += char;
			if ( char === '\\' ) {
				result += next;
				i++;
			} else if ( char === '"' ) {
				inString = false;
			}
		} else if ( char === '"' ) {
			inString = true;
			result += char;
		} else if ( char === '/' && next === '/' ) {
			while ( i < text.length && text[ i ] !== '\n' ) {
				i++;
			}
			result += '\n';
		} else if ( char === '/' && next === '*' ) {
			i += 2;
			while (
				i < text.length &&
				! ( text[ i ] === '*' && text[ i + 1 ] === '/' )
			) {
				i++;
			}
			i++;
		} else {
			result += char;
		}
	}
	return result.replace( /,(\s*[}\]])/g, '$1' );
}

/**
 * Reads the project references of a tsconfig file.
 *
 * @param {string} configPath Absolute path to a tsconfig file.
 * @return {string[]} Absolute paths of the referenced tsconfig files.
 */
function readReferences( configPath ) {
	const config = JSON.parse(
		stripJsonComments( readFileSync( configPath, 'utf8' ) )
	);
	return ( config.references || [] ).map( ( { path: referencePath } ) => {
		const resolved = path.resolve(
			path.dirname( configPath ),
			referencePath
		);
		return existsSync( resolved ) && statSync( resolved ).isDirectory()
			? path.join( resolved, 'tsconfig.json' )
			: resolved;
	} );
}

/**
 * Lists every project reachable from the root tsconfig in the order a single
 * `tsc --build` builds them: depth first through the references, in the order
 * they are listed, with each project after its references.
 *
 * The order matters beyond the declared references. Some projects (such as
 * `storybook`) import packages without referencing them, and rely on the root
 * tsconfig listing them after every package.
 *
 * @param {string} rootDir Repository root.
 * @return {string[]} tsconfig paths, relative to `rootDir`.
 */
export function getTypeScriptBuildOrder( rootDir ) {
	const order = [];
	const visited = new Set();
	const visiting = new Set();

	function visit( configPath ) {
		if ( visited.has( configPath ) ) {
			return;
		}
		if ( visiting.has( configPath ) ) {
			throw new Error( `Circular project reference: ${ configPath }` );
		}
		visiting.add( configPath );
		readReferences( configPath ).forEach( visit );
		visiting.delete( configPath );
		visited.add( configPath );
		order.push( path.relative( rootDir, configPath ) );
	}

	readReferences( path.join( rootDir, 'tsconfig.json' ) ).forEach( visit );

	return order;
}
