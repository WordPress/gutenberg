/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const {
	detectTypeFromLicenseText,
	checkAllCompatible,
	getLicenses,
} = require( '../license' );

describe( 'detectTypeFromLicenseText', () => {
	let licenseText;

	it( "should return 'Apache 2.0' when the license text is the Apache 2.0 license", () => {
		licenseText = fs
			.readFileSync( path.resolve( __dirname, 'licenses/apache2.txt' ) )
			.toString();

		expect( detectTypeFromLicenseText( licenseText ) ).toBe( 'Apache-2.0' );
	} );

	it( "should return 'BSD' when the license text is the BSD 3-clause license", () => {
		licenseText = fs
			.readFileSync(
				path.resolve( __dirname, 'licenses/bsd3clause.txt' )
			)
			.toString();

		expect( detectTypeFromLicenseText( licenseText ) ).toBe( 'BSD' );
	} );

	it( "should return 'BSD-3-Clause-W3C' when the license text is the W3C variation of the BSD 3-clause license", () => {
		licenseText = fs
			.readFileSync( path.resolve( __dirname, 'licenses/w3cbsd.txt' ) )
			.toString();

		expect( detectTypeFromLicenseText( licenseText ) ).toBe(
			'BSD-3-Clause-W3C'
		);
	} );

	it( "should return 'MIT' when the license text is the MIT license", () => {
		licenseText = fs
			.readFileSync( path.resolve( __dirname, 'licenses/mit.txt' ) )
			.toString();

		expect( detectTypeFromLicenseText( licenseText ) ).toBe( 'MIT' );
	} );

	it( "should return 'Apache2 AND MIT' when the license text is Apache2 followed by MIT license", () => {
		licenseText = fs
			.readFileSync(
				path.resolve( __dirname, 'licenses/apache2-mit.txt' )
			)
			.toString();

		expect( detectTypeFromLicenseText( licenseText ) ).toBe(
			'Apache-2.0 AND MIT'
		);
	} );
} );

describe( 'checkAllCompatible', () => {
	it( "should return 'true' when single license is in the allowed list", () => {
		expect( checkAllCompatible( [ 'B' ], [ 'A', 'B', 'C' ] ) ).toBe( true );
	} );

	it( "should return 'false' when single license is not in the allowed list", () => {
		expect( checkAllCompatible( [ 'D' ], [ 'A', 'B', 'C' ] ) ).toBe(
			false
		);
	} );

	it( "should return 'true' when all licenses are in the allowed list", () => {
		expect( checkAllCompatible( [ 'A', 'C' ], [ 'A', 'B', 'C' ] ) ).toBe(
			true
		);
	} );

	it( "should return 'false' when any license is not in the allowed list", () => {
		expect( checkAllCompatible( [ 'A', 'D' ], [ 'A', 'B', 'C' ] ) ).toBe(
			false
		);
	} );
} );

describe( 'getLicenses', () => {
	it( 'should include GPLv3 licenses by default', () => {
		const licenses = getLicenses( false );

		expect( licenses ).toContain( 'GPL-3.0' );
		expect( licenses ).toContain( 'GPL-3.0-only' );
		expect( licenses ).toContain( 'GPL-3.0-or-later' );
	} );

	it( 'should exclude GPLv3 licenses when gpl2 is true', () => {
		const licenses = getLicenses( true );

		expect( licenses ).not.toContain( 'GPL-3.0' );
		expect( licenses ).not.toContain( 'GPL-3.0-only' );
		expect( licenses ).not.toContain( 'GPL-3.0-or-later' );
	} );

	it( 'should always include GPLv2 compatible licenses', () => {
		expect( getLicenses( true ) ).toContain( 'GPL-2.0-or-later' );
		expect( getLicenses( false ) ).toContain( 'GPL-2.0-or-later' );
	} );
} );
