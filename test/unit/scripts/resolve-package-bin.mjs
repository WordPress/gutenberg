import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire( import.meta.url );

/**
 * Resolve a package executable without relying on node_modules/.bin links.
 *
 * @param {string} packageName Package to resolve.
 * @param {string} [binName]   Executable name for packages with multiple bins.
 * @return {string} Absolute executable path.
 */
export function resolvePackageBin( packageName, binName = packageName ) {
	const packageJsonPath = require.resolve( `${ packageName }/package.json` );
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	const binPath =
		typeof packageJson.bin === 'string'
			? packageJson.bin
			: packageJson.bin?.[ binName ];

	if ( typeof binPath !== 'string' ) {
		throw new Error(
			`${ packageName } does not define the ${ binName } executable`
		);
	}

	return path.resolve( path.dirname( packageJsonPath ), binPath );
}
