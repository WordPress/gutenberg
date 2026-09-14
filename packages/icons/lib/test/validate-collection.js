import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { isStrokeBasedSvg } = require( '../validate-collection.cjs' );

describe( 'isStrokeBasedSvg', () => {
	it.each( [
		'<svg style="fill: none">',
		"<svg style='fill: none'>",
		'<svg style="fill:none">',
		'<svg style="fill: none; ">',
	] )( 'recognizes a supported fill-none style in %s', ( svg ) => {
		expect( isStrokeBasedSvg( svg ) ).toBe( true );
	} );

	it( 'ignores fill-none styles on child elements', () => {
		expect(
			isStrokeBasedSvg( '<svg><path style="fill: none" /></svg>' )
		).toBe( false );
	} );
} );
