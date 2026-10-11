import { describe, expect, it } from 'vitest';
import * as lazyImportModule from '..';

describe( 'lazyImport', () => {
	it( 'exports the function as the module itself', () => {
		expect( Object.keys( lazyImportModule ) ).toEqual( [ 'default' ] );
		expect( typeof lazyImportModule.default ).toBe( 'function' );
	} );
} );
