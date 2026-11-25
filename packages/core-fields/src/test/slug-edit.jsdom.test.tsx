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

const sameOriginPost: PostWithSlug = {
	...post,
	link: `${ window.location.origin }/?p=1`,
	permalink_template: `${ window.location.origin }/%postname%/`,
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

	// See https://github.com/WordPress/gutenberg/issues/28479.
	it( 'targets the post-specific window from the editable permalink', () => {
		render( <EditedSlug initial={ sameOriginPost } /> );
		expect(
			screen.getByRole( 'link', { name: /localhost\/テスト\// } )
		).toHaveAttribute( 'target', 'wp-post-1' );
	} );

	it( 'targets the post-specific window from the read-only permalink', () => {
		const { _links, ...readOnlyPost } = sameOriginPost;
		render( <EditedSlug initial={ readOnlyPost } /> );
		expect(
			screen.getByRole( 'link', { name: /localhost/ } )
		).toHaveAttribute( 'target', 'wp-post-1' );
	} );

	it( 'falls back to a plain new tab for an item with no ID', () => {
		const { id, ...withoutId } = sameOriginPost;
		render( <EditedSlug initial={ withoutId } /> );
		expect(
			screen.getByRole( 'link', { name: /localhost\/テスト\// } )
		).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'opens a plain new tab when the permalink points elsewhere', () => {
		render( <EditedSlug initial={ post } /> );
		expect(
			screen.getByRole( 'link', { name: /example\.com\/テスト\// } )
		).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'still opens the documentation link in a plain new tab', () => {
		render( <EditedSlug initial={ post } /> );
		expect(
			screen.getByRole( 'link', { name: /Learn more/ } )
		).toHaveAttribute( 'target', '_blank' );
	} );
} );
