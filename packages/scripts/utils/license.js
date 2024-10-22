/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const { existsSync, readFileSync } = require( 'node:fs' );

const ERROR_TEXT = chalk.reset.inverse.bold.red( ' ERROR ' );
const WARNING_TEXT = chalk.reset.inverse.bold.yellow( ' WARNING ' );

/**
 * @typedef {ReadonlyArray<string>} Licenses
 */

/**
 * Some packages don't included a license string in their package.json file, but they
 * do have a license listed elsewhere. These files are checked for matching license strings.
 * Only the first matching license file with a matching license string is considered.
 *
 * See: licenseFileStrings.
 * @type {ReadonlyArray<string>}
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

/**
 * When searching through files for licensing information, these are the strings we look for,
 * and their matching license.
 */
const licenseFileStrings = {
	'Apache-2.0': [ 'Licensed under the Apache License, Version 2.0' ],
	BSD: [
		'Redistributions in binary form must reproduce the above copyright notice,',
	],
	'BSD-3-Clause-W3C': [ 'W3C 3-clause BSD License' ],
	MIT: [
		'Permission is hereby granted, free of charge,',
		'## License\n\nMIT',
		'## License\n\n  MIT',
	],
};

/*
 * A list of license strings that we've found to be GPL2 compatible.
 *
 * Note the strings with "AND" in them at the bottom: these should only be added when
 * all the licenses in that string are GPL2 compatible.
 */
const gpl2CompatibleLicenses = [
	'0BSD',
	'Apache-2.0 WITH LLVM-exception',
	'Artistic-2.0',
	'BlueOak-1.0.0',
	'BSD-2-Clause',
	'BSD-3-Clause-W3C',
	'BSD-3-Clause',
	'BSD',
	'CC-BY-4.0',
	'CC0-1.0',
	'GPL-2.0-or-later',
	'GPL-2.0',
	'GPL-2.0+',
	'ISC',
	'LGPL-2.1',
	'MIT',
	'MIT/X11',
	'MPL-2.0',
	'ODC-By-1.0',
	'Public Domain',
	'Unlicense',
	'W3C-20150513',
	'WTFPL',
	'Zlib',
];

/*
 * A list of OSS license strings that aren't GPL2 compatible.
 *
 * We're cool with using packages that are licensed under any of these if we're not
 * distributing them (for example, build tools), but we can't included them in a release.
 */
const otherOssLicenses = [
	'Apache-2.0',
	'Apache License, Version 2.0',
	'CC-BY-3.0',
	'CC-BY-SA-2.0',
	'LGPL',
	'Python-2.0',
];

/**
 * @param {boolean} gpl2 Only allow GPL2 compatible licenses.
 * @return {Licenses} Allowed licenses.
 */
const getLicenses = ( gpl2 ) => {
	return [ ...gpl2CompatibleLicenses, ...( gpl2 ? [] : otherOssLicenses ) ];
};

/**
 * Check if a license string matches the given license.
 *
 * The license string can be a single license, or an SPDX-compatible "OR" license string.
 * eg, "(MIT OR Zlib)".
 *
 * @param {string} allowedLicense The license that's allowed.
 * @param {string} licenseType    The license string to check.
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
	if ( ! formattedlicenseType.includes( ' or ' ) ) {
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
	return (
		undefined !==
		subLicenseTypes.find( ( subLicenseType ) =>
			checkLicense( allowedLicense, subLicenseType )
		)
	);
};

/**
 * Check that all of the licenses for a package are compatible.
 *
 * This function is invoked when the licenses are a conjunctive ("AND") list of licenses.
 * In that case, the software is only compatible if all of the licenses in the list are
 * compatible.
 *
 * @param {Licenses} packageLicenses    The licenses that a package is licensed under.
 * @param {Licenses} compatibleLicenses The list of compatible licenses.
 *
 * @return {boolean} true if all of the packageLicenses appear in compatibleLicenses.
 */
function checkAllCompatible( packageLicenses, compatibleLicenses ) {
	return packageLicenses.reduce( ( compatible, packageLicense ) => {
		return (
			compatible &&
			compatibleLicenses.reduce(
				( found, allowedLicense ) =>
					found || checkLicense( allowedLicense, packageLicense ),
				false
			)
		);
	}, true );
}

function detectTypeFromLicenseText( licenseText ) {
	// Check if the file contains any of the strings in licenseFileStrings.
	return Object.keys( licenseFileStrings ).reduce(
		( stringDetectedType, licenseStringType ) => {
			const licenseFileString = licenseFileStrings[ licenseStringType ];

			return licenseFileString.reduce(
				( currentDetectedType, fileString ) => {
					if ( licenseText.includes( fileString ) ) {
						if ( currentDetectedType ) {
							return currentDetectedType.concat(
								' AND ',
								licenseStringType
							);
						}
						return licenseStringType;
					}
					return currentDetectedType;
				},
				stringDetectedType
			);
		},
		false
	);
}

const reportedPackages = new Set();

/**
 * @param {string}   path
 * @param {Licenses} licenses
 * @return {void}
 */
function checkDepLicense( path, licenses ) {
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
	const license =
		packageInfo.license ||
		( packageInfo.licenses &&
			packageInfo.licenses.map( ( l ) => l.type || l ).join( ' OR ' ) );
	let licenseType = typeof license === 'object' ? license.type : license;

	// Check if the license we've detected is telling us to look in the license file, instead.
	if (
		licenseType &&
		licenseFiles.find( ( licenseFile ) =>
			licenseType.includes( licenseFile )
		)
	) {
		licenseType = undefined;
	}

	if ( licenseType !== undefined ) {
		let licenseTypes = [ licenseType ];
		if ( licenseType.includes( ' AND ' ) ) {
			licenseTypes = licenseType
				.replace( /^\(*/g, '' )
				.replace( /\)*$/, '' )
				.split( ' AND ' )
				.map( ( e ) => e.trim() );
		}

		if ( checkAllCompatible( licenseTypes, licenses ) ) {
			return;
		}
	}

	/*
	 * If we haven't been able to detect a license in the package.json file,
	 * or the type was invalid, try reading it from the files defined in
	 * license files, instead.
	 */
	const detectedLicenseType = detectTypeFromLicenseFiles( path );
	if ( ! licenseType && ! detectedLicenseType ) {
		return;
	}

	let detectedLicenseTypes = [ detectedLicenseType ];
	if ( detectedLicenseType && detectedLicenseType.includes( ' AND ' ) ) {
		detectedLicenseTypes = detectedLicenseType
			.replace( /^\(*/g, '' )
			.replace( /\)*$/, '' )
			.split( ' AND ' )
			.map( ( e ) => e.trim() );
	}

	if ( checkAllCompatible( detectedLicenseTypes, licenses ) ) {
		return;
	}

	// Do not report same package twice.
	if ( reportedPackages.has( packageInfo.name ) ) {
		return;
	}

	reportedPackages.add( packageInfo.name );

	process.exitCode = 1;
	process.stdout.write(
		`${ ERROR_TEXT } Module ${ packageInfo.name } has an incompatible license '${ licenseType }'.\n`
	);
}

/**
 *
 * @typedef Options
 * @property {boolean}       gpl2      Only allow GPL2 compatible licenses.
 * @property {Array<string>} [ignored] The list of ignored packages.
 */

/**
 * @param {Object}  deps    The dependencies tree.
 * @param {Options} options
 */
function checkDepsInTree( deps, options ) {
	const licenses = getLicenses( options.gpl2 );

	for ( const key in deps ) {
		const dep = deps[ key ];

		if ( options.ignored?.includes( dep.name ) ) {
			continue;
		}

		if ( Object.keys( dep ).length === 0 ) {
			continue;
		}

		if ( ! dep.hasOwnProperty( 'path' ) && ! dep.missing ) {
			if ( dep.hasOwnProperty( 'peerMissing' ) ) {
				process.stdout.write(
					`${ WARNING_TEXT } Unable to locate path for missing peer dep ${ dep.name }@${ dep.version }. `
				);
			} else {
				process.exitCode = 1;
				process.stdout.write(
					`${ ERROR_TEXT } Unable to locate path for ${ dep.name }@${ dep.version }. `
				);
			}
		} else if ( dep.missing ) {
			for ( const problem of dep.problems ) {
				process.stdout.write( `${ WARNING_TEXT } ${ problem }.\n` );
			}
		} else {
			checkDepLicense( dep.path, licenses );
		}

		if ( dep.hasOwnProperty( 'dependencies' ) ) {
			checkDepsInTree( dep.dependencies, options );
		}
	}
}

/**
 * @param {string} path The path to the package.
 * @return {boolean} true if the package has a license, false if it
 */
function detectTypeFromLicenseFiles( path ) {
	return licenseFiles.reduce( ( detectedType, licenseFile ) => {
		// If another LICENSE file already had licenses in it, use those.
		if ( detectedType ) {
			return detectedType;
		}

		const licensePath = path + '/' + licenseFile;

		if ( existsSync( licensePath ) ) {
			const licenseText = readFileSync( licensePath ).toString();
			return detectTypeFromLicenseText( licenseText );
		}

		return detectedType;
	}, false );
}

module.exports = {
	detectTypeFromLicenseText,
	checkAllCompatible,
	checkDepsInTree,
};
