import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store as shortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store } from '../../../store';
import { unlock } from '../../../lock-unlock';
import BlockVisibilityModal from '../modal';
import BlockVisibilityViewportMenuItem from '../viewport-menu-item';

describe( 'visibility editing permissions', () => {
	let registry: ReturnType< typeof createRegistry >;
	let ids: string[];
	beforeAll( () =>
		registerBlockType( 'test/visibility-permissions', {
			apiVersion: 3,
			title: 'Visibility',
			category: 'text',
			attributes: { metadata: { type: 'object' } },
			save: () => null,
		} )
	);
	afterAll( () => unregisterBlockType( 'test/visibility-permissions' ) );
	beforeEach( () => {
		registry = createRegistry();
		for ( const descriptor of [
			store,
			blocksStore,
			noticesStore,
			shortcutsStore,
		] ) {
			registry.register( descriptor );
		}
		registry
			.dispatch( blocksStore )
			.addBlockTypes( getBlockType( 'test/visibility-permissions' )! );
		const blocks = [
			createBlock( 'test/visibility-permissions' ),
			createBlock( 'test/visibility-permissions' ),
		];
		ids = blocks.map( ( block ) => block.clientId );
		registry.dispatch( store ).resetBlocks( blocks );
	} );
	it( 'withholds visibility editing from a mixed editing-mode selection', () => {
		registry
			.dispatch( store )
			.setBlockEditingMode( ids[ 1 ], 'contentOnly' );
		expect(
			unlock( registry.select( store ) ).canEditBlocksVisibility( ids )
		).toBe( false );
		render(
			<RegistryProvider value={ registry }>
				<BlockVisibilityViewportMenuItem clientIds={ ids } />
			</RegistryProvider>
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Hide' } )
		).not.toBeInTheDocument();
	} );
	it( 'preserves all blocks when editing permission changes before applying visibility', () => {
		const onClose = vi.fn();
		render(
			<RegistryProvider value={ registry }>
				<BlockVisibilityModal clientIds={ ids } onClose={ onClose } />
			</RegistryProvider>
		);
		fireEvent.click(
			screen.getByRole( 'checkbox', {
				name: 'Omit from published content',
			} )
		);
		act( () => {
			registry
				.dispatch( store )
				.setBlockEditingMode( ids[ 1 ], 'contentOnly' );
		} );
		const apply = screen.getByRole( 'button', { name: 'Apply' } );
		fireEvent.submit( apply );
		for ( const id of ids ) {
			expect(
				registry.select( store ).getBlockAttributes( id )?.metadata
			).toBeUndefined();
		}
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
