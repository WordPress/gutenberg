#!/usr/bin/env node
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const getPackages = require( './get-packages' );
const getPackageMeta = require( '../get-package-meta.js' );

/**
 * This script verifies that the local npm package.json files match the versions
 * published to npm. Rarely, the two can get out of sync, making it necessary
 * to update the local package.json files. Updating the package.json versions
 * to the latest version can be done with the '--fix' flag.
 */
async function compareLocalAndNpmPackageVersions() {
	const pkgWithVersions = await Promise.allSettled(
		getPackages().map( async ( pkgPath ) => {
			const slug = '@wordpress/' + path.basename( pkgPath );
			return {
				pkgPath,
				slug,
				pkgJsonPath: path.resolve( pkgPath, 'package.json' ),
				latestVersion: await getNpmVersion( slug ),
				localVersion: getPackageJson(
					path.resolve( pkgPath, 'package.json' )
				)?.version,
			};
		} )
	);

	// Print info about any packages which errored, but we likely don't care.
	const rejectedIssues = pkgWithVersions.filter(
		( { status } ) => status === 'rejected'
	);
	if ( rejectedIssues.length ) {
		console.log(
			"Some errors occurred. This probably just means the package isn't published:"
		);
		rejectedIssues.forEach( ( { reason } ) => console.log( reason ) );
	}

	// Find the packages which have versions that don't match npm.
	const mismatchedPackages = pkgWithVersions
		.filter( ( { status } ) => status === 'fulfilled' )
		.map( ( { value } ) => value )
		.filter(
			( { latestVersion, localVersion } ) =>
				localVersion !== latestVersion
		);

	// Print info about mismatched packages.
	console.log( mismatchedPackages );
	if ( mismatchedPackages.length ) {
		console.log(
			`\n${ mismatchedPackages.length } packages have local versions which don't match npm:`
		);
		mismatchedPackages.forEach(
			( { pkgJsonPath, latestVersion, localVersion, slug } ) =>
				console.log(
					`Local: ${ localVersion }\tNpm: ${ latestVersion }\tName: ${ slug }. Path: ${ pkgJsonPath }`
				)
		);
	} else {
		console.log( 'No mismatching packages found.' );
		process.exit( 0 );
	}

	// If we want to fix them, we can easily update the package.json files with the new versions!
	if ( process.argv.includes( '--fix' ) ) {
		console.log( 'Fixing local package.json files...' );
		await Promise.all( mismatchedPackages.map( fixPackageJson ) );
		console.log( 'Fixed the files!' );
	}
}

compareLocalAndNpmPackageVersions();

async function fixPackageJson( { pkgJsonPath, latestVersion, slug } ) {
	const pkg = getPackageJson( pkgJsonPath );
	if ( ! pkg ) {
		console.log( `Couldn't read package.json for ${ slug }` );
		return;
	}
	pkg.version = latestVersion;
	await fs.promises.writeFile(
		pkgJsonPath,
		JSON.stringify( pkg, null, '\t' ) + '\n'
	);
}

async function getNpmVersion( pkg ) {
	const packageMeta = await getPackageMeta( pkg );
	const latestVersion = packageMeta[ 'dist-tags' ].latest;
	if ( ! latestVersion ) {
		throw new Error( `Could not find version for ${ pkg }` );
	}
	return latestVersion;
}

function getPackageJson( pkgJsonPath ) {
	let pkg;
	try {
		pkg = require( path.resolve( pkgJsonPath ) );
	} catch ( e ) {
		console.error( e );
		// If, for whatever reason, the package's `package.json` cannot be read,
		// consider it as an invalid candidate. In most cases, this can happen
		// when lingering directories are left in the working path when changing
		// to an older branch where a package did not yet exist.
		return null;
	}
	return pkg;
}
