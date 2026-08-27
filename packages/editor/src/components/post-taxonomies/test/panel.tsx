import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import PostTaxonomies from '../panel';

jest.mock(
	'../check',
	() =>
		( { children } ) =>
			children
);

jest.mock(
	'../index',
	() =>
		( { taxonomyWrapper } ) =>
			taxonomyWrapper( 'Taxonomy content', {
				slug: 'type',
				rest_base: 'type',
				labels: {
					menu_name: 'Types',
				},
			} )
);

describe( 'PostTaxonomies panel', () => {
	beforeEach( () => {
		jest.spyOn(
			select( editorStore ),
			'isEditorPanelEnabled'
		).mockReturnValue( true );
		jest.spyOn(
			select( editorStore ),
			'isEditorPanelOpened'
		).mockReturnValue( true );
	} );

	it( 'should not render a taxonomy panel without an assign action', () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );

		render( <PostTaxonomies /> );

		expect(
			screen.queryByText( 'Taxonomy content' )
		).not.toBeInTheDocument();
	} );

	it( 'should render a taxonomy panel when an assign action exists', () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-assign-type': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/posts/1/assign-type',
					},
				],
			},
		} );

		render( <PostTaxonomies /> );

		expect( screen.getByText( 'Taxonomy content' ) ).toBeVisible();
	} );
} );
