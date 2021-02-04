/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Temporary patch to fix all xCode 12 libs
 */

const nodeModulesDir = path.join( __dirname, '../', 'node_modules' );

const fetchRNPackageDirs = ( dir ) => {
	const dirList = fs.readdirSync( dir );
	const packageDirs = [];
	dirList.forEach( ( packageName ) => {
		const packageDir = path.join( dir, packageName );
		if ( packageName.startsWith( '@' ) ) {
			packageDirs.push( ...fetchRNPackageDirs( packageDir ) );
		} else {
			const files = fs.readdirSync( packageDir );
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
