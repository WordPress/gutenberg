/**
 * External dependencies
 */
const { realpathSync } = require( 'fs' );
const { sync: readPkgUp } = require( 'read-pkg-up' );

/**
 * Internal dependencies
 */
const { getCurrentWorkingDirectory } = require( './process' );

const { packageJson, path: pkgPath } = readPkgUp( {
	cwd: realpathSync( getCurrentWorkingDirectory() ),
} );

const getPackagePath = () => pkgPath;

const getPackageProp = ( prop ) => packageJson && packageJson[ prop ];

const hasPackageProp = ( prop ) =>
	packageJson && packageJson.hasOwnProperty( prop );

module.exports = {
	getPackagePath,
	getPackageProp,
	hasPackageProp,
};
