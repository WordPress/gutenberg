import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DataForm } from '@wordpress/dataviews';
import type { Field } from '@wordpress/dataviews';
import MediaForm from '../index';
import type { Media } from '../../media-editor-provider';

let mockFields: Field< Media >[] = [];

vi.mock(
	import( '@wordpress/dataviews' ),
	() =>
		( {
			DataForm: vi.fn( () => null ),
		} ) as unknown as typeof import( '@wordpress/dataviews' )
);

vi.mock(
	import( '../../media-editor-provider' ),
	() =>
		( {
			useMediaEditorContext: () => ( {
				media: { id: 1 },
				fields: mockFields,
				onChange: () => {},
			} ),
		} ) as unknown as typeof import( '../../media-editor-provider' )
);

function getFormFieldIds() {
	const { form } = vi.mocked( DataForm ).mock.lastCall![ 0 ];
	return ( form.fields ?? [] ).map( ( field ) =>
		typeof field === 'string' ? field : field.id
	);
}

describe( 'MediaForm', () => {
	it( 'orders the default form whatever the order of the fields', () => {
		mockFields = [
			'acme_credit',
			'caption',
			'attached_to',
			'title',
			'filename',
			'date',
			'author',
		].map( ( id ) => ( { id } ) );

		render( <MediaForm /> );

		expect( getFormFieldIds() ).toEqual( [
			'title',
			'caption',
			'date',
			'author',
			'filename',
			'attached_to',
			'acme_credit',
		] );
	} );

	it( 'keeps the other fields in the order they were given', () => {
		mockFields = [ 'acme_b', 'title', 'acme_a' ].map( ( id ) => ( {
			id,
		} ) );

		render( <MediaForm /> );

		expect( getFormFieldIds() ).toEqual( [ 'title', 'acme_b', 'acme_a' ] );
	} );
} );
