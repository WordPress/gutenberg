import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

/**
 * The package folders used when `wpPlugin.packageDirs` is not set.
 */
export const DEFAULT_PACKAGE_DIRS = [ 'packages' ];

/**
 * Find every package listed by the `wpPlugin.packageDirs` option.
 *
 * Each entry is a path relative to the root directory. An entry is either a
 * package folder itself (it holds a `package.json`, like `my-package`), or a
 * folder of packages (like `packages`, meaning every `packages/<name>` that
 * holds a `package.json`).
 *
 * Packages are identified by their folder name, which names their build
 * output (`build/scripts/<name>`, `build/modules/<name>`, …), so two packages
 * must not share a folder name.
 *
 * @param {string}   rootDir     Root directory of the project.
 * @param {string[]} packageDirs Package folders, relative to the root directory.
 * @return {Map<string, string>} Map from package folder name to its absolute directory.
 */
export function getPackageDirs( rootDir, packageDirs = DEFAULT_PACKAGE_DIRS ) {
	if (
		! Array.isArray( packageDirs ) ||
		packageDirs.some( ( entry ) => typeof entry !== 'string' )
	) {
		throw new Error(
			'`wpPlugin.packageDirs` must be an array of folder paths.'
		);
	}

	/** @type {Map<string, string>} */
	const packages = new Map();

	/** @param {string} packageDir Absolute package directory. */
	const addPackage = ( packageDir ) => {
		const packageName = path.basename( packageDir );
		const existing = packages.get( packageName );
		if ( existing && existing !== packageDir ) {
			throw new Error(
				`Two packages share the folder name "${ packageName }": ` +
					`${ path.relative( rootDir, existing ) } and ` +
					`${ path.relative( rootDir, packageDir ) }. ` +
					'Rename one of them, since the folder name names the build output.'
			);
		}
		packages.set( packageName, packageDir );
	};

	for ( const entry of packageDirs ) {
		const dir = path.resolve( rootDir, entry );
		if ( ! existsSync( dir ) || ! statSync( dir ).isDirectory() ) {
			throw new Error(
				`\`wpPlugin.packageDirs\` lists "${ entry }", which is not a folder.`
			);
		}

		if ( existsSync( path.join( dir, 'package.json' ) ) ) {
			addPackage( dir );
			continue;
		}

		readdirSync( dir )
			.filter( ( name ) =>
				existsSync( path.join( dir, name, 'package.json' ) )
			)
			.sort()
			.forEach( ( name ) => addPackage( path.join( dir, name ) ) );
	}

	return packages;
}
