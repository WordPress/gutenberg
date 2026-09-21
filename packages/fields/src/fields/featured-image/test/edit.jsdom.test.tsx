import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EntityProvider } from '@wordpress/core-data';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as noticesStore } from '@wordpress/notices';
import FeaturedImageEdit from '../edit';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const field = {
	id: 'featured_media',
	type: 'media',
	label: 'Featured Image',
	placeholder: 'Set featured image',
	getValue: ( { item }: { item: { featured_media?: number } } ) =>
		item.featured_media,
	setValue: ( { value }: { value?: number } ) => ( {
		featured_media: value ?? 0,
	} ),
} as any;

const postType = { slug: 'post' };
const attachments = [
	{
		id: 42,
		source_url: 'https://example.com/42.jpg',
		mime_type: 'image/jpeg',
		alt_text: '',
		title: { rendered: '42' },
		media_details: {},
	},
];

// The control reads the upload permission, the attachments and the post type
// from the `core` store; a stand-in avoids the resolvers' requests.
function createTestRegistry() {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			selectors: {
				canUser: () => true,
				getEntityRecords: (
					state: unknown,
					kind: string,
					name: string,
					query: any
				) => ( query?.include?.[ 0 ] === 42 ? attachments : null ),
				getPostType: () => postType,
			},
			actions: {
				receiveEntityRecords: () => ( {
					type: 'RECEIVE_ENTITY_RECORDS',
				} ),
			},
		} )
	);
	registry.register( noticesStore );
	return registry;
}

// Appends a marker that echoes the classic props, like the plugins that
// extend the classic panel do.
const withMarker =
	( OriginalComponent: React.ComponentType< any > ) => ( props: any ) => (
		<>
			<OriginalComponent { ...props } />
			<p>
				{ `Extended: image ${ props.featuredImageId } of post ${ props.currentPostId } (${ props.postType?.slug }), media ${ props.media?.source_url ?? 'none' }` }
			</p>
		</>
	);

describe( 'FeaturedImageEdit', () => {
	afterEach( () => {
		removeFilter( 'editor.PostFeaturedImage', 'test/with-marker' );
	} );

	it( 'applies the editor.PostFeaturedImage filter with the classic props when the item is the post in context', () => {
		addFilter( 'editor.PostFeaturedImage', 'test/with-marker', withMarker );
		render(
			<RegistryProvider value={ createTestRegistry() }>
				<EntityProvider kind="postType" type="post" id={ 5 }>
					<FeaturedImageEdit
						data={
							{ id: 5, type: 'post', featured_media: 42 } as any
						}
						field={ field }
						onChange={ () => {} }
					/>
				</EntityProvider>
			</RegistryProvider>
		);
		expect(
			screen.getByText(
				'Extended: image 42 of post 5 (post), media https://example.com/42.jpg'
			)
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toBeInTheDocument();
	} );

	it( 'renders the media control directly outside the post context', () => {
		addFilter( 'editor.PostFeaturedImage', 'test/with-marker', withMarker );
		render(
			<RegistryProvider value={ createTestRegistry() }>
				<FeaturedImageEdit
					data={ { id: 5, type: 'post', featured_media: 0 } as any }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect( screen.queryByText( /^Extended:/ ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Set featured image' } )
		).toBeInTheDocument();
	} );

	it( 'renders the media control directly when another post is in context', () => {
		addFilter( 'editor.PostFeaturedImage', 'test/with-marker', withMarker );
		render(
			<RegistryProvider value={ createTestRegistry() }>
				<EntityProvider kind="postType" type="post" id={ 7 }>
					<FeaturedImageEdit
						data={
							{ id: 5, type: 'post', featured_media: 0 } as any
						}
						field={ field }
						onChange={ () => {} }
					/>
				</EntityProvider>
			</RegistryProvider>
		);
		expect( screen.queryByText( /^Extended:/ ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Set featured image' } )
		).toBeInTheDocument();
	} );
} );
