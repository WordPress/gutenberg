/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );
const { existsSync, readFileSync } = require( 'fs' );
const { sep } = require( 'path' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { getArgFromCLI, hasArgInCLI } = require( '../utils' );

/*
 * WARNING: Changes to this file may inadvertently cause us to distribute code that
 * is not GPL2 compatible.
 *
 * When adding a new license (for example, when a new package has a variation of the
 * various license strings), please ensure that changes to this file are explicitly
 * reviewed and approved.
 */

const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );

const prod = hasArgInCLI( '--prod' ) || hasArgInCLI( '--production' );
const dev = hasArgInCLI( '--dev' ) || hasArgInCLI( '--development' );
const gpl2 = hasArgInCLI( '--gpl2' );
const ignored = hasArgInCLI( '--ignore' ) ?
	getArgFromCLI( '--ignore' )
		// "--ignore=a, b" -> "[ 'a', ' b' ]"
		.split( ',' )
		// "[ 'a', ' b' ]" -> "[ 'a', 'b' ]"
		.map( ( moduleName ) => moduleName.trim() ) :
	[];

/*
 * A list of license strings that we've found to be GPL2 compatible.
 *
 * Note the strings with "AND" in them at the bottom: these should only be added when
 * all the licenses in that string are GPL2 compatible.
 */
const gpl2CompatibleLicenses = [
	'Apache-2.0 WITH LLVM-exception',
	'Artistic-2.0',
	'BSD',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'BSD-3-Clause-W3C',
	'BSD-like',
	'CC-BY-4.0',
	'CC0-1.0',
	'GPL-2.0',
	'GPL-2.0+',
	'GPL-2.0-or-later',
	'ISC',
	'LGPL-2.1',
	'MIT',
	'MIT/X11',
	'MIT (http://mootools.net/license.txt)',
	'MPL-2.0',
	'Public Domain',
	'Unlicense',
	'WTFPL',
	'Zlib',
	'(MIT AND BSD-3-Clause)',
	'(MIT AND Zlib)',
	'(CC-BY-4.0 AND MIT)',
];

/*
 * A list of OSS license strings that aren't GPL2 compatible.
 *
 * We're cool with using packages that are licensed under any of these if we're not
 * distributing them (for example, build tools), but we can't included them in a release.
 */
const otherOssLicenses = [
	'Apache-2.0',
	'Apache 2.0',
	'Apache License, Version 2.0',
	'Apache version 2.0',
	'CC-BY-3.0',
	'LGPL',
];

const licenses = [
	...gpl2CompatibleLicenses,
	...( gpl2 ? [] : otherOssLicenses ),
];

/*
 * Some packages don't included a license string in their package.json file, but they
 * do have a license listed elsewhere. These files are checked for matching license strings.
 */
const licenseFiles = [
	'LICENCE',
	'license',
	'LICENSE',
	'LICENSE.md',
	'LICENSE.txt',
	'LICENSE-MIT',
	'MIT-LICENSE.txt',
	'Readme.md',
	'README.md',
];

/*
 * When searching through files for licensing information, these are the strings we look for,
 * and their matching license.
 */
const licenseFileStrings = {
	'Apache-2.0': [
		'Licensed under the Apache License, Version 2.0',
	],
	BSD: [
		'Redistributions in binary form must reproduce the above copyright notice,',
	],
	'BSD-3-Clause-W3C': [
		'W3C 3-clause BSD License',
	],
	MIT: [
		'Permission is hereby granted, free of charge,',
		'## License\n\nMIT',
		'## License\n\n  MIT',
	],
};

/**
 * Check if a license string matches the given license.
 *
 * The license string can be a single license, or an SPDX-compatible "OR" license string.
 * eg, "(MIT OR Zlib)".
 *
 * @param {string} allowedLicense The license that's allowed.
 * @param {string} licenseType The license string to check.
 *
 * @return {boolean} true if the licenseType matches the allowedLicense, false if it doesn't.
 */
const checkLicense = ( allowedLicense, licenseType ) => {
	if ( ! licenseType ) {
		return false;
	}

	// Some licenses have unusual capitalisation in them.
	const formattedAllowedLicense = allowedLicense.toLowerCase();
	const formattedlicenseType = licenseType.toLowerCase();

	if ( formattedAllowedLicense === formattedlicenseType ) {
		return true;
	}

	// We can skip the parsing below if there isn't an 'OR' in the license.
	if ( ! licenseType.includes( 'OR' ) ) {
		return false;
	}

	/*
	 * In order to do a basic parse of SPDX-compatible "OR" license strings, we:
	 * - Remove surrounding brackets: "(mit or zlib)" -> "mit or zlib"
	 * - Split it into an array: "mit or zlib" -> [ "mit", "zlib" ]
	 * - Trim any remaining whitespace from each element
	 */
	const subLicenseTypes = formattedlicenseType
		.replace( /^\(*/g, '' )
		.replace( /\)*$/, '' )
		.split( ' or ' )
		.map( ( e ) => e.trim() );

	// We can then check our array of licenses against the allowedLicense.
	return undefined !== subLicenseTypes.find( ( subLicenseType ) => checkLicense( allowedLicense, subLicenseType ) );
};

/**
 * Returns true if the given module path is not to be ignored for consideration
 * in license validation, or false otherwise.
 *
 * @param {string} moduleName Module path.
 *
 * @return {boolean} Whether module path is not to be ignored.
 */
const isNotIgnoredModule = ( moduleName ) => (
	! ignored.some( ( ignoredItem ) => (
		// `moduleName` is a file path to the module directory. Assume CLI arg
		// is passed as basename of package (directory(s) after node_modules).
		// Prefix with sep to avoid false-positives on prefixing variations.
		moduleName.endsWith( sep + ignoredItem )
	) )
);

// Use `npm ls` to grab a list of all the packages.
const child = spawn.sync( 'npm', [
	'ls',
	'--parseable',
	...( prod ? [ '--prod' ] : [] ),
	...( dev ? [ '--dev' ] : [] ),
] );

const modules = child.stdout
	.toString()
	.split( '\n' )
	.filter( isNotIgnoredModule );

modules.forEach( ( path ) => {
	if ( ! path ) {
		return;
	}

	const filename = path + '/package.json';
	if ( ! existsSync( filename ) ) {
		process.stdout.write( `Unable to locate package.json in ${ path }.` );
		process.exit( 1 );
	}

	/*
	 * The package.json format can be kind of weird. We allow for the following formats:
	 * - { license: 'MIT' }
	 * - { license: { type: 'MIT' } }
	 * - { licenses: [ 'MIT', 'Zlib' ] }
	 * - { licenses: [ { type: 'MIT' }, { type: 'Zlib' } ] }
	 */
	const packageInfo = require( filename );
	const license = packageInfo.license ||
		(
			packageInfo.licenses &&
			packageInfo.licenses
				.map( ( l ) => l.type || l )
				.join( ' OR ' )
		);
	let licenseType = typeof license === 'object' ? license.type : license;

	// Check if the license we've detected is telling us to look in the license file, instead.
	if ( licenseType && licenseFiles.find( ( licenseFile ) => licenseType.includes( licenseFile ) ) ) {
		licenseType = undefined;
	}

	/*
	 * If we haven't been able to detect a license in the package.json file, try reading
	 * it from the files defined in licenseFiles, instead.
	 */
	if ( licenseType === undefined ) {
		licenseType = licenseFiles.reduce( ( detectedType, licenseFile ) => {
			if ( detectedType ) {
				return detectedType;
			}

			const licensePath = path + '/' + licenseFile;

			if ( existsSync( licensePath ) ) {
				const licenseText = readFileSync( licensePath ).toString();

				// Check if the file contains any of the strings in licenseFileStrings
				return Object.keys( licenseFileStrings ).reduce( ( stringDetectedType, licenseStringType ) => {
					const licenseFileString = licenseFileStrings[ licenseStringType ];

					return licenseFileString.reduce( ( currentDetectedType, fileString ) => {
						if ( licenseText.includes( fileString ) ) {
							return licenseStringType;
						}
						return currentDetectedType;
					}, stringDetectedType );
				}, detectedType );
			}
			return detectedType;
		}, false );
	}

	if ( ! licenseType ) {
		return false;
	}

	// Now that we finally have a license to check, see if any of the allowed licenses match.
	const allowed = licenses.find( ( allowedLicense ) => checkLicense( allowedLicense, licenseType ) );

	if ( ! allowed ) {
		process.exitCode = 1;
		process.stdout.write( `${ ERROR } Module ${ packageInfo.name } has an incompatible license '${ licenseType }'.\n` );
	}
} );
