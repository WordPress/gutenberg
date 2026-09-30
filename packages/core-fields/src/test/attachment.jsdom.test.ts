import { describe, expect, it } from 'vitest';
import attachment from '../attachment';

describe( 'attachment', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( attachment ) ).toEqual( [
			'caption',
			'description',
			'mime_type',
		] );
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

	it( 'reads the raw caption', () => {
		const { getValue } = attachment.caption;
		expect( getValue?.( { item: { caption: 'Plain' } } ) ).toBe( 'Plain' );
		expect(
			getValue?.( {
				item: { caption: { raw: 'Raw', rendered: '<p>Raw</p>' } },
			} )
		).toBe( 'Raw' );
		expect( getValue?.( { item: {} } ) ).toBe( '' );
	} );

	it( 'reads the raw description', () => {
		expect(
			attachment.description.getValue?.( {
				item: { description: { raw: 'Raw', rendered: '<p>Raw</p>' } },
			} )
		).toBe( 'Raw' );
	} );
} );
