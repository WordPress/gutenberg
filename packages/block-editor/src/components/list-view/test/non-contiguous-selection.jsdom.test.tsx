import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '../../../store';
import useBlockSelection from '../use-block-selection';

describe( 'non-contiguous List View selection', () => {
	let registry: ReturnType< typeof createRegistry >;
	let blocks: Block[];
	beforeEach( () => {
		registerBlockType( 'core/test-list-selection', {
			apiVersion: 3,
			attributes: {},
			title: 'Selection fixture',
			category: 'text',
			save: () => null,
		} );
		registry = createRegistry();
		registry.register( blocksStore );
		registry.register( store );
		blocks = Array.from( { length: 3 }, () =>
			createBlock( 'core/test-list-selection' )
		);
		registry.dispatch( store ).resetBlocks( blocks );
		registry.dispatch( store ).selectBlock( blocks[ 0 ].clientId );
	} );
	afterEach( () => {
		unregisterBlockType( 'core/test-list-selection' );
		vi.restoreAllMocks();
	} );

	it.each( [ 'MacIntel', 'Linux' ] )(
		'toggles selected blocks in List View with the platform modifier (%s)',
		async ( platform ) => {
			vi.spyOn( window.navigator, 'platform', 'get' ).mockReturnValue(
				platform
			);
			const { result } = renderHook( useBlockSelection, {
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			} );
			const event = new MouseEvent( 'click', {
				cancelable: true,
				...( platform === 'MacIntel'
					? { metaKey: true }
					: { ctrlKey: true } ),
			} );
			await act( () =>
				result.current.updateBlockSelection(
					event,
					blocks[ 2 ].clientId
				)
			);
			expect( event.defaultPrevented ).toBe( true );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
			expect(
				registry.select( store ).getSelectedBlocksInitialCaretPosition()
			).toBeNull();
			await act( () =>
				result.current.updateBlockSelection(
					event,
					blocks[ 2 ].clientId
				)
			);
			expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
				blocks[ 0 ].clientId
			);
		}
	);

	it( 'builds a non-contiguous selection using the List View keyboard', async () => {
		const { result } = renderHook( useBlockSelection, {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		} );
		const event = new KeyboardEvent( 'keydown', {
			key: ' ',
			keyCode: 32,
			cancelable: true,
		} );
		await act( () =>
			result.current.updateBlockSelection( event, blocks[ 2 ].clientId )
		);
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ blocks[ 0 ].clientId, blocks[ 2 ].clientId ]
		);
		expect(
			registry.select( store ).getSelectedBlocksInitialCaretPosition()
		).toBeNull();
		await act( () =>
			result.current.updateBlockSelection( event, blocks[ 0 ].clientId )
		);
		expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
			blocks[ 2 ].clientId
		);
	} );
} );
