/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );
const { existsSync, readFileSync } = require( 'fs' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { hasCliArg } = require( '../utils' );

const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );

const prod = hasCliArg( '--prod' ) || hasCliArg( '--production' );
const dev = hasCliArg( '--dev' ) || hasCliArg( '--development' );
const gpl2 = hasCliArg( '--gpl2' );

const gpl2Licenses = [
	'Apache-2.0 WITH LLVM-exception',
	'Artistic-2.0',
	'BSD',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'BSD-like',
	'CC-BY-3.0',
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
];

const ossLicenses = [
	'Apache-2.0',
	'Apache 2.0',
	'Apache License, Version 2.0',
	'Apache version 2.0',
];

const licenses = [
	...gpl2Licenses,
	...( gpl2 ? [] : ossLicenses ),
];

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

const licenseFileStrings = {
	'Apache-2.0': [
		'Licensed under the Apache License, Version 2.0',
	],
	BSD: [
		'Redistributions in binary form must reproduce the above copyright notice,',
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
 * The license string can be a single license, or an SPDX-compatible OR license string.
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
	if ( licenseType.indexOf( 'OR' ) < 0 ) {
		return false;
	}

	/*
	 * In order to do a basic parse of SPDX-compatible OR license strings, we:
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
	return subLicenseTypes.reduce( ( satisfied, subLicenseType ) => {
		if ( checkLicense( allowedLicense, subLicenseType ) ) {
			return true;
		}
		return satisfied;
	}, false );
};

// Use `npm ls` to grab a list of all the packages.
const child = spawn.sync( 'npm', [
	'ls',
	'--parseable',
	...( prod ? [ '--prod' ] : [] ),
	...( dev ? [ '--dev' ] : [] ),
] );

const modules = child.stdout.toString().split( '\n' );

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
		}, false );
	}

	if ( ! licenseType ) {
		return false;
	}

	// Now that we finally have a license to check, see if any of the allowed licenses match.
	const allowed = licenses.reduce( ( satisfied, allowedLicense ) => {
		if ( checkLicense( allowedLicense, licenseType ) ) {
			return true;
		}
		return satisfied;
	}, false );

	if ( ! allowed ) {
		process.exitCode = 1;
		process.stdout.write( `${ ERROR } Module ${ packageInfo.name } has an incompatible license '${ licenseType }'.\n` );
	}
} );
