import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
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
		expect( screen.getByText( 'Featured Image' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'To edit this field, you need permission to upload media.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Set featured image' } )
		).not.toBeInTheDocument();
	} );
} );
