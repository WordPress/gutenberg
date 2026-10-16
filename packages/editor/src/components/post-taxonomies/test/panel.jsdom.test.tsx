import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Fragment } from '@wordpress/element';
import { select } from '@wordpress/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store as editorStore } from '@wordpress/editor';
import PostTaxonomies from '../panel';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '../check' ), () => ( {
	default: ( { children }: { children: ReactNode } ) => children,
} ) );

vi.mock( import( '../index' ), () => ( {
	default: ( ( {
		taxonomyWrapper,
	}: Parameters< typeof import( '../index' ).default >[ 0 ] ) => {
		if ( ! taxonomyWrapper ) {
			return [];
		}

		const wrapper = taxonomyWrapper as unknown as (
			children: ReactNode,
			taxonomy: {
				slug: string;
				rest_base: string;
				labels: { menu_name: string };
			}
		) => ReactNode;

		return [
			<Fragment key="type">
				{ wrapper( 'Taxonomy content', {
					slug: 'type',
					rest_base: 'type',
					labels: {
						menu_name: 'Types',
					},
				} ) }
			</Fragment>,
		];
	} ) as unknown as typeof import( '../index' ).default,
} ) );

describe( 'PostTaxonomies panel', () => {
	beforeEach( () => {
		vi.spyOn(
			select( editorStore ),
			'isEditorPanelEnabled'
		).mockReturnValue( true );
		vi.spyOn(
			select( editorStore ),
			'isEditorPanelOpened'
		).mockReturnValue( true );
	} );

	it( 'should not render a taxonomy panel without an assign action', () => {
		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );

		render( <PostTaxonomies /> );

		expect(
			screen.queryByText( 'Taxonomy content' )
		).not.toBeInTheDocument();
	} );

	it( 'should render a taxonomy panel when an assign action exists', () => {
		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
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
