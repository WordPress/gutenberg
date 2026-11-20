import { describe, expect, it } from 'vitest';
import { getPreservedUserCss } from '../get-preserved-user-css';

describe( 'getPreservedUserCss', () => {
	const variationCss =
		'body { padding: 30px; } .wp-site-blocks { max-width: 1340px; }';

	it( 'returns empty when user CSS is only theme variation CSS', () => {
		expect( getPreservedUserCss( variationCss, [ variationCss ] ) ).toBe(
			''
		);
	} );

	it( 'keeps Additional CSS after stripping a previously selected variation', () => {
		expect(
			getPreservedUserCss( `${ variationCss } .hero { color: red; }`, [
				variationCss,
			] )
		).toBe( '.hero { color: red; }' );
	} );

	it( 'preserves user CSS when it does not match any theme variation', () => {
		expect(
			getPreservedUserCss( '.hero { color: red; }', [ variationCss ] )
		).toBe( '.hero { color: red; }' );
	} );

	it( 'returns empty for blank user CSS', () => {
		expect( getPreservedUserCss( '   ', [ variationCss ] ) ).toBe( '' );
		expect( getPreservedUserCss( undefined, [ variationCss ] ) ).toBe( '' );
	} );
} );
