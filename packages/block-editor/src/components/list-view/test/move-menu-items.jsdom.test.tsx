import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import ListViewMoveMenuItems from '../move-menu-items';
import { ListViewContext } from '../context';
import type { ListViewContextValue } from '../types';
import { store as blockEditorStore } from '../../../store';

const blockSettings = {
	apiVersion: 3,
	title: 'Item',
	category: 'text',
	save: () => null,
} as unknown as BlockConfiguration;

type Destination = { rootClientId: string; index: number } | null;

// The blocks used throughout: a, b, and group (c).
function setUp( destinations: { up: Destination; down: Destination } ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const blocks = [
		createBlock( 'test/item' ),
		createBlock( 'test/item' ),
		createBlock( 'test/item', {}, [ createBlock( 'test/item' ) ] ),
	];
	const [ a, b, group ] = blocks;
	const ids = {
		a: a.clientId,
		b: b.clientId,
		group: group.clientId,
		c: group.innerBlocks[ 0 ].clientId,
	};
	const dispatch = registry.dispatch( blockEditorStore );
	dispatch.resetBlocks( blocks );
	// Containers need list settings to accept blocks.
	dispatch.updateBlockListSettings( ids.group, {} );

	const getMoveDestination = vi.fn(
		( clientIds: string[], direction: 'up' | 'down' ) =>
			destinations[ direction ]
	);
	const onClose = vi.fn();
	const renderItems = ( clientIds: string[] ) =>
		render(
			<RegistryProvider value={ registry }>
				<ListViewContext.Provider
					value={
						{
							getMoveDestination,
						} as unknown as ListViewContextValue
					}
				>
					<ListViewMoveMenuItems
						clientIds={ clientIds }
						onClose={ onClose }
					/>
				</ListViewContext.Provider>
			</RegistryProvider>
		);
	const select = registry.select( blockEditorStore );
	return { ids, select, getMoveDestination, onClose, renderItems };
}

describe( 'ListViewMoveMenuItems', () => {
	beforeAll( () => {
		registerBlockType( 'test/item', blockSettings );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/item' );
	} );

	let user: ReturnType< typeof userEvent.setup >;
	beforeEach( () => {
		user = userEvent.setup();
	} );

	it( 'asks the List View where the blocks go each way', () => {
		const t = setUp( { up: null, down: null } );
		t.renderItems( [ t.ids.b ] );

		expect( t.getMoveDestination ).toHaveBeenCalledWith(
			[ t.ids.b ],
			'up'
		);
		expect( t.getMoveDestination ).toHaveBeenCalledWith(
			[ t.ids.b ],
			'down'
		);
	} );

	it( 'disables a move that has nowhere to go, keeping it focusable', () => {
		const t = setUp( { up: null, down: { rootClientId: '', index: 1 } } );
		t.renderItems( [ t.ids.a ] );

		const up = screen.getByRole( 'menuitem', { name: 'Move up' } );
		expect( up ).toHaveAttribute( 'aria-disabled', 'true' );
		// Without the `disabled` attribute, so it can still be focused.
		expect( up ).toBeEnabled();
		expect(
			screen.getByRole( 'menuitem', { name: 'Move down' } )
		).not.toHaveAttribute( 'aria-disabled' );
	} );

	it( 'moves the blocks to the destination and closes the menu', async () => {
		const t = setUp( { up: null, down: { rootClientId: '', index: 1 } } );
		t.renderItems( [ t.ids.a ] );

		await user.click(
			screen.getByRole( 'menuitem', { name: 'Move down' } )
		);

		expect( t.select.getBlockOrder() ).toEqual( [
			t.ids.b,
			t.ids.a,
			t.ids.group,
		] );
		expect( t.onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'moves the blocks out of their parent', async () => {
		const t = setUp( { up: { rootClientId: '', index: 2 }, down: null } );
		t.renderItems( [ t.ids.c ] );

		await user.click( screen.getByRole( 'menuitem', { name: 'Move up' } ) );

		expect( t.select.getBlockOrder() ).toEqual( [
			t.ids.a,
			t.ids.b,
			t.ids.c,
			t.ids.group,
		] );
		expect( t.select.getBlockOrder( t.ids.group ) ).toEqual( [] );
	} );

	it( 'does nothing for a disabled move', async () => {
		const t = setUp( { up: null, down: null } );
		t.renderItems( [ t.ids.a ] );

		await user.click( screen.getByRole( 'menuitem', { name: 'Move up' } ) );

		expect( t.select.getBlockOrder() ).toEqual( [
			t.ids.a,
			t.ids.b,
			t.ids.group,
		] );
		expect( t.onClose ).not.toHaveBeenCalled();
	} );
} );
