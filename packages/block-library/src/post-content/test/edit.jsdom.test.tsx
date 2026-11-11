import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { unregisterBlockType } from '@wordpress/blocks';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';

vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityProp: vi.fn(),
} ) );

const teaser = '<!-- wp:paragraph --><p>Teaser text</p><!-- /wp:paragraph -->';
const remainder =
	'<!-- wp:paragraph --><p>Rest of the post</p><!-- /wp:paragraph -->';
const more = '<!-- wp:more --><!--more--><!-- /wp:more -->';

let PostContentEdit: ComponentType< {
	context: {
		postId: number;
		postType: string;
		queryId: number;
		templateSlug: string;
	};
	attributes: { tagName?: string };
	setAttributes: ( attributes: { tagName: string } ) => void;
	clientId: string;
} >;

function renderPreview(
	content: { raw?: string; rendered?: string },
	{ canEdit = true, templateSlug = 'index' } = {}
) {
	const coreDispatch = dispatch( coreStore );
	const resource = { kind: 'postType', name: 'post', id: 123 };
	coreDispatch.receiveUserPermission( 'update/postType/post/123', canEdit );
	coreDispatch.finishResolution( 'canUser', [ resource, undefined ] );
	vi.mocked( useEntityProp ).mockReturnValue( [ null, vi.fn(), content ] );
	render(
		<SlotFillProvider>
			<PostContentEdit
				context={ {
					postId: resource.id,
					postType: resource.name,
					queryId: 0,
					templateSlug,
				} }
				attributes={ {} }
				setAttributes={ vi.fn() }
				clientId="post-content-preview"
			/>
		</SlotFillProvider>
	);
}

describe( 'Post Content Query Loop preview', () => {
	beforeAll( async () => {
		globalThis.wpVitest.mockMatchMedia();
		globalThis.wpVitest.mockResizeObserver();
		const paragraph = await vi.importActual< { init: () => void } >(
			'../../paragraph'
		);
		const moreBlock = await vi.importActual< { init: () => void } >(
			'../../more'
		);
		const edit = await vi.importActual< {
			default: typeof PostContentEdit;
		} >( '../edit' );
		PostContentEdit = edit.default;
		paragraph.init();
		moreBlock.init();
	} );

	afterAll( () => {
		unregisterBlockType( 'core/more' );
		unregisterBlockType( 'core/paragraph' );
	} );

	test.each( [ 'index', 'home' ] )(
		'shows the teaser up to the More divider in the %s template',
		async ( templateSlug ) => {
			renderPreview(
				{ raw: [ teaser, more, remainder ].join( '\n\n' ) },
				{ templateSlug }
			);

			expect(
				await screen.findByText( 'Teaser text' )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'Rest of the post' )
			).not.toBeInTheDocument();
		}
	);

	test( 'shows all content without a More divider', async () => {
		renderPreview( { raw: [ teaser, remainder ].join( '\n\n' ) } );

		expect( await screen.findByText( 'Teaser text' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Rest of the post' ) ).toBeInTheDocument();
	} );

	test( 'shows full content in a single template preview', async () => {
		renderPreview(
			{ raw: [ teaser, more, remainder ].join( '\n\n' ) },
			{ templateSlug: 'single' }
		);
		expect(
			await screen.findByText( 'Rest of the post' )
		).toBeInTheDocument();
	} );

	test( 'uses the REST-rendered fallback when the user cannot edit the post', () => {
		renderPreview(
			{ raw: teaser, rendered: '<p>Public response</p>' },
			{ canEdit: false }
		);

		expect( screen.getByText( 'Public response' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Teaser text' ) ).not.toBeInTheDocument();
	} );
} );
