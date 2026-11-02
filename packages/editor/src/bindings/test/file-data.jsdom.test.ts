import { describe, expect, it } from 'vitest';
import fileDataBindings from '../file-data';

describe( 'file-data bindings', () => {
	const bindings = { url: { source: 'core/file-data' } };

	it( 'returns the URL of the parent File block', () => {
		const values = fileDataBindings.getValues( {
			context: { 'core/file-href': 'https://example.com/report.pdf' },
			bindings,
		} );

		expect( values ).toEqual( { url: 'https://example.com/report.pdf' } );
	} );

	it( 'returns undefined outside a File block', () => {
		expect(
			fileDataBindings.getValues( { context: {}, bindings } )
		).toEqual( { url: undefined } );
	} );

	it( 'is read-only', () => {
		expect( fileDataBindings ).not.toHaveProperty( 'setValues' );
	} );
} );
