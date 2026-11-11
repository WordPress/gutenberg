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
import FeaturedImageEdit from '../post_type_supports/featured_media/edit';

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

const postType = {
	slug: 'post',
	labels: {
		featured_image: 'Cover image',
		set_featured_image: 'Set cover image',
	},
};
const attachments = [
	{
		id: 42,
		source_url: 'https://example.com/42.jpg',
		mime_type: 'image/jpeg',
		alt_text: 'Forty-two',
		title: { rendered: '42' },
		media_details: {
			sizes: {
				large: { source_url: 'https://example.com/42-1024x768.jpg' },
				medium: { source_url: 'https://example.com/42-300x225.jpg' },
			},
		},
	},
];

// The control reads the upload permission, the attachments and the post type
// from the `core` store; a stand-in avoids the resolvers' requests.
function createTestRegistry( media: unknown[] = attachments ) {
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
				) => ( query?.include?.[ 0 ] === 42 ? media : null ),
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

// Appends a marker to the media picker, like the plugins that extend it do.
const withPickerMarker =
	( MediaUpload: React.ComponentType< any > ) => ( props: any ) => (
		<>
			<MediaUpload { ...props } />
			<p>{ `Picker extended: ${ props.title }` }</p>
		</>
	);

describe( 'FeaturedImageEdit', () => {
	afterEach( () => {
		removeFilter( 'editor.PostFeaturedImage', 'test/with-marker' );
		removeFilter( 'editor.MediaUpload', 'test/with-picker-marker' );
		removeFilter(
			'editor.PostFeaturedImage.imageSize',
			'test/with-image-size'
		);
	} );

	it( 'applies the editor.PostFeaturedImage, editor.MediaUpload and imageSize filters when the item is the post in context', () => {
		addFilter( 'editor.PostFeaturedImage', 'test/with-marker', withMarker );
		addFilter(
			'editor.MediaUpload',
			'test/with-picker-marker',
			withPickerMarker
		);
		const sizeCalls: unknown[][] = [];
		addFilter(
			'editor.PostFeaturedImage.imageSize',
			'test/with-image-size',
			( size: string, mediaId: number, postId: number ) => {
				sizeCalls.push( [ size, mediaId, postId ] );
				return 'medium';
			}
		);
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
		expect(
			screen.getByText( 'Picker extended: Cover image' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Forty-two' } )
		).toHaveAttribute( 'src', 'https://example.com/42-300x225.jpg' );
		expect( sizeCalls ).toEqual( [ [ 'large', 42, 5 ] ] );
	} );

	it( 'renders the media control directly, with the plain picker and the full-size preview, outside the post context', () => {
		addFilter( 'editor.PostFeaturedImage', 'test/with-marker', withMarker );
		addFilter(
			'editor.MediaUpload',
			'test/with-picker-marker',
			withPickerMarker
		);
		addFilter(
			'editor.PostFeaturedImage.imageSize',
			'test/with-image-size',
			() => 'medium'
		);
		render(
			<RegistryProvider value={ createTestRegistry() }>
				<FeaturedImageEdit
					data={ { id: 5, type: 'post', featured_media: 42 } as any }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect( screen.queryByText( /^Extended:/ ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( /^Picker extended/ )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Forty-two' } )
		).toHaveAttribute( 'src', 'https://example.com/42.jpg' );
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
			screen.getByRole( 'button', { name: 'Set cover image' } )
		).toBeInTheDocument();
	} );

	it( 'falls back to the thumbnail, then the full size, for the preview in the post editor', () => {
		const renderWith = ( mediaDetails: Record< string, unknown > ) =>
			render(
				<RegistryProvider
					value={ createTestRegistry( [
						{ ...attachments[ 0 ], media_details: mediaDetails },
					] ) }
				>
					<EntityProvider kind="postType" type="post" id={ 5 }>
						<FeaturedImageEdit
							data={
								{
									id: 5,
									type: 'post',
									featured_media: 42,
								} as any
							}
							field={ field }
							onChange={ () => {} }
						/>
					</EntityProvider>
				</RegistryProvider>
			);
		const preview = () => screen.getByRole( 'img', { name: 'Forty-two' } );

		const view = renderWith( {
			sizes: {
				thumbnail: { source_url: 'https://example.com/42-150x150.jpg' },
			},
		} );
		expect( preview() ).toHaveAttribute(
			'src',
			'https://example.com/42-150x150.jpg'
		);
		view.unmount();

		renderWith( {} );
		expect( preview() ).toHaveAttribute(
			'src',
			'https://example.com/42.jpg'
		);
	} );
} );
