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

const checkLicense = ( allowedLicense, licenseType ) => {
	if ( ! licenseType ) {
		return false;
	}

	const formattedAllowedLicense = allowedLicense.toLowerCase();
	const formattedlicenseType = licenseType.toLowerCase();

	if ( formattedAllowedLicense === formattedlicenseType ) {
		return true;
	}

	if ( licenseType.indexOf( 'OR' ) < 0 ) {
		return false;
	}

	const subLicenseTypes = formattedlicenseType.replace( /^\(*/g, '' ).replace( /\)*$/, '' ).split( ' or ' ).map( ( e ) => e.trim() );

	return subLicenseTypes.reduce( ( satisfied, subLicenseType ) => {
		if ( checkLicense( allowedLicense, subLicenseType ) ) {
			return true;
		}
		return satisfied;
	}, false );
};

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

	const packageInfo = require( filename );
	const license = packageInfo.license || ( packageInfo.licenses && packageInfo.licenses.map( ( l ) => l.type || l ).join( ' OR ' ) );
	let licenseType = typeof license === 'object' ? license.type : license;

	if ( licenseType === undefined ) {
		licenseType = licenseFiles.reduce( ( detectedType, licenseFile ) => {
			if ( detectedType ) {
				return detectedType;
			}

			const licensePath = path + '/' + licenseFile;

			if ( existsSync( licensePath ) ) {
				const licenseText = readFileSync( licensePath ).toString();

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
