import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '../../../store';
import useClickSelection from '../use-click-selection';

function Canvas( { blocks }: { blocks: Block[] } ) {
	return (
		<div ref={ useClickSelection() }>
			{ blocks.map( ( block, index ) => (
				<div
					key={ block.clientId }
					id={ `block-${ block.clientId }` }
					data-block={ block.clientId }
					className="block-editor-block-list__block"
				>
					<span>{ `Block ${ index }` }</span>
					<button>Control { index }</button>
				</div>
			) ) }
		</div>
	);
}

describe( 'explicit canvas selection', () => {
	let registry: ReturnType< typeof createRegistry >;
	let blocks: Block[];
	beforeEach( () => {
		registerBlockType( 'core/test-canvas-selection', {
			apiVersion: 3,
			attributes: {},
			title: 'Selection fixture',
			category: 'text',
			save: () => null,
		} );
		registry = createRegistry();
		registry.register( store );
		blocks = Array.from( { length: 4 }, () =>
			createBlock( 'core/test-canvas-selection' )
		);
		registry.dispatch( store ).resetBlocks( blocks );
		registry.dispatch( store ).selectBlock( blocks[ 0 ].clientId );
	} );
	afterEach( () => {
		unregisterBlockType( 'core/test-canvas-selection' );
		vi.restoreAllMocks();
	} );

	it.each( [ 'MacIntel', 'Linux' ] )(
		'toggles canvas selection membership with the platform modifier (%s)',
		( platform ) => {
			render(
				<RegistryProvider value={ registry }>
					<Canvas blocks={ blocks } />
				</RegistryProvider>
			);
			vi.spyOn( window.navigator, 'platform', 'get' ).mockReturnValue(
				platform
			);
			const modifier =
				platform === 'MacIntel' ? { metaKey: true } : { ctrlKey: true };
			fireEvent.mouseDown( screen.getByText( 'Block 2' ), modifier );
			fireEvent.click( screen.getByText( 'Block 2' ), modifier );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
			fireEvent.mouseDown(
				screen.getByRole( 'button', { name: 'Control 3' } ),
				modifier
			);
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
			fireEvent.mouseDown( screen.getByText( 'Block 2' ), modifier );
			fireEvent.click( screen.getByText( 'Block 2' ), modifier );
			expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
				blocks[ 0 ].clientId
			);
		}
	);

	it( 'returns from explicit selection to ordinary click and Shift-range selection', () => {
		render(
			<RegistryProvider value={ registry }>
				<Canvas blocks={ blocks } />
			</RegistryProvider>
		);
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
		fireEvent.mouseDown( screen.getByText( 'Block 3' ), {
			shiftKey: true,
		} );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			blocks.map( ( block ) => block.clientId )
		);
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
		fireEvent.mouseDown( screen.getByText( 'Block 1' ) );
		expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
			blocks[ 1 ].clientId
		);
	} );
} );
