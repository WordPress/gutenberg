import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	getBlockType,
	getDefaultBlockName,
	setDefaultBlockName,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store } from '../../../store';
import BlockActions from '..';

describe( 'insertion destinations for selected blocks', () => {
	let registry: ReturnType< typeof createRegistry >;
	let previousDefaultBlockName: ReturnType< typeof getDefaultBlockName >;
	const names = [
		'core/paragraph',
		'test/insertion-parent',
		'test/direct-insertion',
	];
	beforeAll( () => {
		previousDefaultBlockName = getDefaultBlockName();
		setDefaultBlockName( 'core/paragraph' );
		for ( const name of names ) {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				attributes: {},
				save: () => null,
			} );
		}
	} );
	afterAll( () => {
		setDefaultBlockName( previousDefaultBlockName! );
		for ( const name of names ) {
			unregisterBlockType( name );
		}
	} );
	beforeEach( () => {
		registry = createRegistry();
		registry.register( blocksStore );
		registry.register( store );
		registry.register( noticesStore );
		registry
			.dispatch( blocksStore )
			.setDefaultBlockName( 'core/paragraph' );
		registry
			.dispatch( blocksStore )
			.addBlockTypes( names.map( ( name ) => getBlockType( name )! ) );
	} );
	it.each( [ false, true ] )(
		'checks Add after against the last parent rather than the first (%s)',
		( firstLocked ) => {
			const blocks = [
				createBlock( 'core/paragraph' ),
				createBlock( 'core/paragraph' ),
			];
			const parents = blocks.map( ( block ) =>
				createBlock( 'test/insertion-parent', {}, [ block ] )
			);
			registry.dispatch( store ).resetBlocks( parents );
			registry
				.dispatch( store )
				.updateBlockListSettings( parents[ 0 ].clientId, {
					templateLock: firstLocked ? 'all' : false,
				} );
			registry
				.dispatch( store )
				.updateBlockListSettings( parents[ 1 ].clientId, {
					templateLock: firstLocked ? false : 'all',
				} );
			render(
				<RegistryProvider value={ registry }>
					<BlockActions
						clientIds={ blocks.map( ( block ) => block.clientId ) }
					>
						{ ( {
							canInsertBefore,
							canInsertAfter,
							onInsertBefore,
							onInsertAfter,
						} ) => (
							<>
								{ canInsertBefore && (
									<button onClick={ onInsertBefore }>
										Add before
									</button>
								) }
								{ canInsertAfter && (
									<button onClick={ onInsertAfter }>
										Add after
									</button>
								) }
							</>
						) }
					</BlockActions>
				</RegistryProvider>
			);
			expect(
				!! screen.queryByRole( 'button', { name: 'Add before' } )
			).toBe( ! firstLocked );
			const after = screen.queryByRole( 'button', { name: 'Add after' } );
			expect( !! after ).toBe( firstLocked );
			if ( after ) {
				fireEvent.click( after );
			}
			expect(
				registry.select( store ).getBlockOrder( parents[ 1 ].clientId )
			).toHaveLength( firstLocked ? 2 : 1 );
		}
	);
	it( 'uses the shared default at the document root, matching the insertion action', () => {
		const block = createBlock( 'core/paragraph' );
		registry.dispatch( store ).resetBlocks( [ block ] );
		registry.dispatch( store ).updateBlockListSettings( '', {
			allowedBlocks: [ 'core/paragraph' ],
			defaultBlock: { name: 'test/direct-insertion' },
		} );
		render(
			<RegistryProvider value={ registry }>
				<BlockActions clientIds={ [ block.clientId ] }>
					{ ( { canInsertAfter, onInsertAfter } ) =>
						canInsertAfter && (
							<button onClick={ onInsertAfter }>Add after</button>
						)
					}
				</BlockActions>
			</RegistryProvider>
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Add after' } ) );
		const ids = registry.select( store ).getBlockOrder();
		expect( ids ).toHaveLength( 2 );
		expect( registry.select( store ).getBlockName( ids[ 1 ] ) ).toBe(
			'core/paragraph'
		);
	} );
	it( 'uses the destination configured default block for Add after', () => {
		const block = createBlock( 'core/paragraph' );
		const parent = createBlock( 'test/insertion-parent', {}, [ block ] );
		registry.dispatch( store ).resetBlocks( [ parent ] );
		registry.dispatch( store ).updateBlockListSettings( parent.clientId, {
			allowedBlocks: [ 'test/direct-insertion' ],
			defaultBlock: { name: 'test/direct-insertion' },
		} );
		render(
			<RegistryProvider value={ registry }>
				<BlockActions clientIds={ [ block.clientId ] }>
					{ ( { canInsertAfter, onInsertAfter } ) =>
						canInsertAfter && (
							<button onClick={ onInsertAfter }>Add after</button>
						)
					}
				</BlockActions>
			</RegistryProvider>
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Add after' } ) );
		const ids = registry.select( store ).getBlockOrder( parent.clientId );
		expect( ids ).toHaveLength( 2 );
		expect( registry.select( store ).getBlockName( ids[ 1 ] ) ).toBe(
			'test/direct-insertion'
		);
	} );
} );
