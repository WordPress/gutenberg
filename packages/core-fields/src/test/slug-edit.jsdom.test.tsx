import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import SlugEdit from '../post_type_supports/slug/edit';
import { fieldExtensions } from '../post_type_supports/slug/field';
import type { PostWithSlug } from '../post_type_supports/slug/types';

const field = {
	id: 'slug',
	getValue: fieldExtensions.getValue!,
} as any;

const post: PostWithSlug = {
	id: 1,
	slug: '%e3%83%86%e3%82%b9%e3%83%88',
	title: 'My Post Title',
	link: 'https://example.com/?p=1',
	permalink_template: 'https://example.com/%postname%/',
	_links: { 'wp:action-publish': [ { href: '' } ] },
};

// Holds the edits the way DataForm does, so the control gets them back.
function EditedSlug( { initial }: { initial: PostWithSlug } ) {
	const [ data, setData ] = useState( initial );
	return (
		<>
			<SlugEdit
				field={ field }
				data={ data }
				onChange={ ( edits ) =>
					setData( ( current ) => ( { ...current, ...edits } ) )
				}
			/>
			<output data-testid="stored">{ data.slug }</output>
		</>
	);
}

describe( 'SlugEdit', () => {
	it( 'shows a percent-encoded slug decoded', () => {
		render( <EditedSlug initial={ post } /> );
		expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'テスト' );
		expect(
			screen.getByRole( 'link', { name: /example\.com\/テスト\// } )
		).toBeInTheDocument();
	} );

	it( 'cleans the slug the user changed when the field loses focus', () => {
		render( <EditedSlug initial={ post } /> );
		const input = screen.getByRole( 'textbox' );
		fireEvent.focus( input );
		fireEvent.change( input, { target: { value: 'My New Slug' } } );
		expect( input ).toHaveValue( 'My New Slug' );
		fireEvent.blur( input );
		expect( input ).toHaveValue( 'my-new-slug' );
		expect( screen.getByTestId( 'stored' ) ).toHaveTextContent(
			'my-new-slug'
		);
	} );

	it( 'leaves an untouched slug as it is when the field loses focus', () => {
		render( <EditedSlug initial={ post } /> );
		const input = screen.getByRole( 'textbox' );
		fireEvent.focus( input );
		fireEvent.blur( input );
		expect( screen.getByTestId( 'stored' ) ).toHaveTextContent(
			'%e3%83%86%e3%82%b9%e3%83%88'
		);
	} );

	it( 'lets the user clear the field while typing', () => {
		render( <EditedSlug initial={ post } /> );
		const input = screen.getByRole( 'textbox' );
		fireEvent.focus( input );
		fireEvent.change( input, { target: { value: '' } } );
		expect( input ).toHaveValue( '' );
		fireEvent.blur( input );
		expect( input ).toHaveValue( 'my-post-title' );
	} );
} );
