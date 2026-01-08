/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Temporary patch to fix all xCode 12 libs
 */

const nodeModulesDir = path.join( __dirname, '../', 'node_modules' );

/**
 * Recursively find all directories containing .podspec files.
 * Works with both npm (hoisted) and pnpm (non-hoisted) structures.
 *
 * @param {string} dir   - Directory to search
 * @param {number} depth - Current recursion depth (to prevent infinite loops)
 * @return {Array} Array of objects with dir, files, and package properties
 */
const fetchRNPackageDirs = ( dir, depth = 0 ) => {
	// Prevent infinite recursion
	if ( depth > 10 ) {
		return [];
	}

	let dirList;
	try {
		dirList = fs.readdirSync( dir, { withFileTypes: true } );
	} catch {
		return [];
	}

	const packageDirs = [];
	dirList
		.filter( ( file ) => file.isDirectory() || file.isSymbolicLink() )
		.map( ( file ) => file.name )
		.forEach( ( packageName ) => {
			const packageDir = path.join( dir, packageName );

			// For pnpm's .pnpm directory, recurse into it
			if ( packageName === '.pnpm' ) {
				packageDirs.push(
					...fetchRNPackageDirs( packageDir, depth + 1 )
				);
				return;
			}

			// Skip other hidden directories
			if ( packageName.startsWith( '.' ) ) {
				return;
			}

			// For scoped packages (@scope/name), recurse into the scope
			if ( packageName.startsWith( '@' ) ) {
				packageDirs.push(
					...fetchRNPackageDirs( packageDir, depth + 1 )
				);
				return;
			}

			// For pnpm virtual store entries (package@version), look in node_modules subdirectory
			if ( packageName.includes( '@' ) && depth > 0 ) {
				const pnpmNodeModules = path.join( packageDir, 'node_modules' );
				if ( fs.existsSync( pnpmNodeModules ) ) {
					packageDirs.push(
						...fetchRNPackageDirs( pnpmNodeModules, depth + 1 )
					);
				}
				return;
			}

			// Check for podspec files in this directory
			let files;
			try {
				files = fs.readdirSync( packageDir );
			} catch {
				return;
			}

			const podSpecs = files.filter( ( file ) =>
				file.toLowerCase().endsWith( '.podspec' )
			);
			if ( podSpecs.length > 0 ) {
				packageDirs.push( {
					dir: packageDir,
					files: podSpecs,
					package: packageName,
				} );
			}
		} );
	return packageDirs;
};

const packagesWithPodspec = fetchRNPackageDirs( nodeModulesDir );
const dependencyRegex = /(s\.dependency +(?:'|"))React('|")/;
packagesWithPodspec.forEach( ( packageWithPodspec ) => {
	packageWithPodspec.files.forEach( ( file ) => {
		const filePath = path.join( packageWithPodspec.dir, file );
		const fileContents = fs.readFileSync( filePath );

		if ( `${ fileContents }`.match( dependencyRegex ) ) {
			fs.writeFileSync(
				filePath,
				`${ fileContents }`.replace( dependencyRegex, '$1React-Core$2' )
			);
		}
	} );
} );
