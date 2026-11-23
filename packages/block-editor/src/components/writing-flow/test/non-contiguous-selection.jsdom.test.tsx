import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { useMergeRefs } from '@wordpress/compose';
import { focus } from '@wordpress/dom';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '../../../store';
import useClickSelection from '../use-click-selection';
import useMultiSelection from '../use-multi-selection';

function Canvas( { blocks, content }: { blocks: Block[]; content?: string } ) {
	return (
		<div
			ref={ useMergeRefs( [ useClickSelection(), useMultiSelection() ] ) }
		>
			{ blocks.map( ( block, index ) => (
				<div
					key={ block.clientId }
					id={ `block-${ block.clientId }` }
					data-block={ block.clientId }
					className="block-editor-block-list__block"
					tabIndex={ -1 }
				>
					<span>{ `Block ${ index }` }</span>
					<button>Control { index }</button>
					{ content && (
						<div
							dangerouslySetInnerHTML={ {
								__html: content.replaceAll(
									'{{clientId}}',
									block.clientId
								),
							} }
						/>
					) }
				</div>
			) ) }
		</div>
	);
}

describe( 'non-contiguous canvas selection', () => {
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

	describe.each( [ 'predicate', 'find fallback' ] )( '%s', ( detection ) => {
		const focusable = focus.focusable;

		beforeEach( () => {
			// JSDOM has no layout; browser DOM tests verify actual visibility.
			vi.spyOn(
				HTMLElement.prototype,
				'offsetWidth',
				'get'
			).mockReturnValue( 20 );
			vi.spyOn( window.navigator, 'platform', 'get' ).mockReturnValue(
				'MacIntel'
			);
			if ( detection === 'find fallback' ) {
				// Emulate the public API supplied by an older WordPress runtime.
				focus.focusable = { find: focusable.find } as typeof focusable;
			}
		} );

		afterEach( () => {
			focus.focusable = focusable;
		} );

		it.each( [
			[
				'associated label',
				'<label for="control-{{clientId}}"><span data-testid="target">Control</span></label><input id="control-{{clientId}}" type="checkbox" />',
			],
			[
				'implicit label',
				'<label><span data-testid="target">Control</span><input type="checkbox" /></label>',
			],
		] )(
			'preserves native activation when modifier-clicking an %s',
			( _, html ) => {
				render(
					<RegistryProvider value={ registry }>
						<Canvas blocks={ blocks } content={ html } />
					</RegistryProvider>
				);
				const target = screen.getAllByTestId( 'target' )[ 2 ];
				const checkbox = screen.getAllByRole( 'checkbox', {
					name: 'Control',
				} )[ 2 ];
				expect( checkbox ).not.toBeChecked();
				expect( fireEvent.mouseDown( target, { metaKey: true } ) ).toBe(
					true
				);
				expect( fireEvent.click( target, { metaKey: true } ) ).toBe(
					true
				);
				expect( checkbox ).toBeChecked();
				expect(
					registry.select( store ).getSelectedBlockClientIds()
				).toEqual( [ blocks[ 0 ].clientId ] );
			}
		);

		it.each( [
			[
				'button',
				'<button><span data-testid="target">Control</span></button>',
			],
			[ 'input', '<input data-testid="target">' ],
			[ 'textarea', '<textarea data-testid="target"></textarea>' ],
			[
				'select',
				'<select data-testid="target"><option>Option</option></select>',
			],
			[
				'link',
				'<a href="#target"><span data-testid="target">Link</span></a>',
			],
			[
				'summary',
				'<details><summary><span data-testid="target">Disclosure</span></summary></details>',
			],
			[
				'custom checkbox',
				'<div role="checkbox" tabindex="0"><span data-testid="target">Control</span></div>',
			],
			[
				'negative tabindex control',
				'<div tabindex="-1"><span data-testid="target">Control</span></div>',
			],
			[
				'disabled form control',
				'<button disabled><span data-testid="target">Control</span></button>',
			],
			[
				'button role without tabindex',
				'<div role="button"><span data-testid="target">Control</span></div>',
			],
			[
				'control around editable text',
				'<div role="checkbox" tabindex="0"><div contenteditable="true"><span data-testid="target">Text</span></div></div>',
			],
		] )(
			'leaves modifier-click on a nested %s to the control',
			( _, html ) => {
				render(
					<RegistryProvider value={ registry }>
						<Canvas blocks={ blocks } content={ html } />
					</RegistryProvider>
				);
				const target = screen.getAllByTestId( 'target' )[ 2 ];
				expect( fireEvent.mouseDown( target, { metaKey: true } ) ).toBe(
					true
				);
				expect( fireEvent.click( target, { metaKey: true } ) ).toBe(
					true
				);
				expect(
					registry.select( store ).getSelectedBlockClientIds()
				).toEqual( [ blocks[ 0 ].clientId ] );
			}
		);

		it.each( [
			[
				'unassociated label',
				'<label><span data-testid="target">Text</span></label>',
			],
			[
				'editable text',
				'<div contenteditable="true" role="textbox"><span data-testid="target">Text</span></div>',
			],
			[
				'plain-text editable text',
				'<div contenteditable="plaintext-only"><span data-testid="target">Text</span></div>',
			],
			[
				'focusable block wrapper',
				'<span data-testid="target">Text</span>',
			],
		] )( 'toggles block selection from %s', ( _, html ) => {
			render(
				<RegistryProvider value={ registry }>
					<Canvas blocks={ blocks } content={ html } />
				</RegistryProvider>
			);
			const target = screen.getAllByTestId( 'target' )[ 2 ];
			fireEvent.mouseDown( target, { metaKey: true } );
			fireEvent.click( target, { metaKey: true } );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
		} );
	} );
	it.each( [ 'MacIntel', 'Linux' ] )(
		'toggles selected blocks in the canvas with the platform modifier (%s)',
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

	it( 'returns from multiSelectSet to ordinary click and Shift-range selection', () => {
		render(
			<RegistryProvider value={ registry }>
				<Canvas blocks={ blocks } />
			</RegistryProvider>
		);
		act( () => {
			registry
				.dispatch( store )
				.multiSelectSet( [
					blocks[ 0 ].clientId,
					blocks[ 2 ].clientId,
				] );
		} );
		fireEvent.mouseDown( screen.getByText( 'Block 3' ), {
			shiftKey: true,
		} );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			blocks.map( ( block ) => block.clientId )
		);
		act( () => {
			registry
				.dispatch( store )
				.multiSelectSet( [
					blocks[ 0 ].clientId,
					blocks[ 2 ].clientId,
				] );
		} );
		fireEvent.mouseDown( screen.getByText( 'Block 1' ) );
		expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
			blocks[ 1 ].clientId
		);
		const parents = [
			createBlock(
				'core/test-canvas-selection',
				{},
				blocks.slice( 0, 2 )
			),
			createBlock( 'core/test-canvas-selection', {}, blocks.slice( 2 ) ),
		];
		act( () => {
			registry.dispatch( store ).resetBlocks( parents );
			registry
				.dispatch( store )
				.multiSelectSet( [
					blocks[ 0 ].clientId,
					blocks[ 2 ].clientId,
				] );
		} );
		fireEvent.mouseDown( screen.getByText( 'Block 3' ), {
			shiftKey: true,
		} );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			parents.map( ( block ) => block.clientId )
		);
	} );

	it( 'keeps canvas and List View selection synchronized', () => {
		render(
			<RegistryProvider value={ registry }>
				<Canvas blocks={ blocks } />
			</RegistryProvider>
		);
		const control = screen.getByRole( 'button', { name: 'Control 3' } );
		control.focus();
		const range = document.createRange();
		range.selectNodeContents( screen.getByText( 'Block 1' ) );
		document.getSelection()!.addRange( range );
		act( () => {
			// null is the external-focus contract used by List View.
			registry
				.dispatch( store )
				.multiSelectSet(
					[ blocks[ 0 ].clientId, blocks[ 2 ].clientId ],
					null
				);
		} );
		expect( document.getSelection()!.rangeCount ).toBe( 0 );
		expect( control ).toHaveFocus();
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ blocks[ 0 ].clientId, blocks[ 2 ].clientId ]
		);
	} );
} );
