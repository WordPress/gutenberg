import {
	render,
	screen,
	waitForElementToBeRemoved,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as noticesStore } from '@wordpress/notices';
import MediaEdit from '../index';

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

// The component reads the upload permission and the attachments from the
// `core` store; a stand-in avoids the resolvers' requests.
function createTestRegistry( { canUpload = true } = {} ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			selectors: {
				canUser: () => canUpload,
				getEntityRecords: () => null,
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

describe( 'MediaEdit', () => {
	afterEach( () => {
		removeFilter( 'editor.MediaUpload', 'test/media-upload-marker' );
	} );

	it( 'resolves the media picker through the editor.MediaUpload filter', async () => {
		const received: Record< string, unknown >[] = [];
		render(
			<RegistryProvider value={ createTestRegistry() }>
				<MediaEdit
					data={ { featured_media: 0 } }
					field={ field }
					onChange={ () => {} }
					mediaUploadProps={ {
						unstableFeaturedImageFlow: true,
						mode: 'browse',
					} }
				/>
			</RegistryProvider>
		);
		expect(
			screen.getByRole( 'button', { name: 'Set featured image' } )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Filter marker' ) ).not.toBeInTheDocument();

		addFilter(
			'editor.MediaUpload',
			'test/media-upload-marker',
			( MediaUpload: React.ComponentType< any > ) =>
				( props: Record< string, unknown > ) => {
					received.push( props );
					return (
						<>
							<MediaUpload { ...props } />
							<div>Filter marker</div>
						</>
					);
				}
		);
		expect(
			await screen.findByText( 'Filter marker' )
		).toBeInTheDocument();
		expect( received.at( -1 ) ).toMatchObject( {
			unstableFeaturedImageFlow: true,
			mode: 'browse',
			allowedTypes: [ 'image' ],
			multiple: false,
			title: 'Featured Image',
		} );
		expect(
			screen.getByRole( 'button', { name: 'Set featured image' } )
		).toBeInTheDocument();

		removeFilter( 'editor.MediaUpload', 'test/media-upload-marker' );
		await waitForElementToBeRemoved( () =>
			screen.queryByText( 'Filter marker' )
		);
	} );

	it( 'shows a message instead of the picker without upload permission', () => {
		render(
			<RegistryProvider
				value={ createTestRegistry( { canUpload: false } ) }
			>
				<MediaEdit
					data={ { featured_media: 0 } }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect(
			screen.getByText(
				'Featured Image: To edit this field, you need permission to upload media.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Set featured image' } )
		).not.toBeInTheDocument();
	} );
} );
