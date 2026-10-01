import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import MediaForm from '../index';
import type { Media } from '../../media-editor-provider';

let mockFields: Field< Media >[] = [];
let mockForm: Form | undefined;

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
				form: mockForm,
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

const CORE_FIELD_IDS = [
	'title',
	'alt_text',
	'caption',
	'description',
	'date',
	'author',
	'filename',
	'mime_type',
	'filesize',
	'media_dimensions',
	'attached_to',
];

describe( 'MediaForm', () => {
	beforeEach( () => {
		mockFields = [];
		mockForm = undefined;
	} );

	it( 'uses the form of the provider settings', () => {
		mockForm = { fields: [ 'acme_credit', 'title' ] };

		render( <MediaForm /> );

		expect( getFormFieldIds() ).toEqual( [ 'acme_credit', 'title' ] );
	} );

	it( 'prefers the form prop over the form of the provider settings', () => {
		mockForm = { fields: [ 'acme_credit', 'title' ] };

		render( <MediaForm form={ { fields: [ 'caption' ] } } /> );

		expect( getFormFieldIds() ).toEqual( [ 'caption' ] );
	} );

	it( 'falls back to the default form whatever the order of the fields', () => {
		mockFields = [
			'caption',
			'attached_to',
			'title',
			'filename',
			'date',
			'author',
		].map( ( id ) => ( { id } ) );

		render( <MediaForm /> );

		expect( getFormFieldIds() ).toEqual( CORE_FIELD_IDS );
	} );

	it( 'leaves the other fields out of the default form', () => {
		mockFields = [ 'acme_b', 'title', 'acme_a' ].map( ( id ) => ( {
			id,
		} ) );

		render( <MediaForm /> );

		expect( getFormFieldIds() ).toEqual( CORE_FIELD_IDS );
	} );
} );
