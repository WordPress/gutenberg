import { describe, expect, it } from 'vitest';
import attachment from '../attachment';

describe( 'attachment', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( attachment ) ).toEqual( [ 'mime_type' ] );
	} );

	it( 'reads the file type', () => {
		const { getValue, render } = attachment.mime_type;
		expect( getValue?.( { item: { mime_type: 'image/png' } } ) ).toBe(
			'image/png'
		);
		expect( getValue?.( { item: {} } ) ).toBe( '' );
		expect(
			( render as ( props: { item: object } ) => string )( { item: {} } )
		).toBe( '-' );
	} );
} );
