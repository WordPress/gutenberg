import { describe, expect, it } from 'vitest';
import save from '../save';

describe( 'navigation save', () => {
	it( 'serializes inner blocks when the block references no menu', () => {
		expect( save( { attributes: {} } ) ).not.toBeUndefined();
	} );

	it( 'skips inner blocks when the block references a menu by ref', () => {
		expect( save( { attributes: { ref: 1 } } ) ).toBeUndefined();
	} );

	it( 'skips inner blocks when the block references a menu by slug', () => {
		expect( save( { attributes: { slug: 'header' } } ) ).toBeUndefined();
	} );
} );
