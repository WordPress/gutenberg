import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store } from '../../../store';
import useSelectAll from '../use-select-all';

vi.mock(
	import( '@wordpress/keyboard-shortcuts' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		__unstableUseShortcutEventMatch:
			() => ( _: string, event: { key: string } ) =>
				event.key === 'a',
	} )
);

function Canvas() {
	return <div ref={ useSelectAll() } data-testid="canvas" />;
}

describe( 'Select All with different block parents', () => {
	let registry: ReturnType< typeof createRegistry >;
	beforeAll( () =>
		registerBlockType( 'test/select-all', {
			apiVersion: 3,
			title: 'Select All',
			category: 'text',
			attributes: {},
			save: () => null,
		} )
	);
	afterAll( () => unregisterBlockType( 'test/select-all' ) );
	beforeEach( () => {
		registry = createRegistry();
		registry.register( store );
	} );
	it.each( [ false, true ] )(
		'expands through the common parent without mistaking equal counts for all siblings (%s)',
		( nested ) => {
			const blocks = Array.from( { length: 4 }, () =>
				createBlock( 'test/select-all' )
			);
			const groups = [
				createBlock( 'test/select-all', {}, blocks.slice( 0, 2 ) ),
				createBlock( 'test/select-all', {}, blocks.slice( 2 ) ),
			];
			const container = createBlock( 'test/select-all', {}, groups );
			registry
				.dispatch( store )
				.resetBlocks( nested ? [ container ] : groups );
			registry
				.dispatch( store )
				.multiSelectSet( [
					blocks[ 0 ].clientId,
					blocks[ 2 ].clientId,
				] );
			render(
				<RegistryProvider value={ registry }>
					<Canvas />
				</RegistryProvider>
			);
			fireEvent.keyDown( screen.getByTestId( 'canvas' ), {
				key: 'a',
				ctrlKey: true,
			} );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( groups.map( ( group ) => group.clientId ) );
			fireEvent.keyDown( screen.getByTestId( 'canvas' ), {
				key: 'a',
				ctrlKey: true,
			} );
			const expected = nested
				? [ container.clientId ]
				: groups.map( ( group ) => group.clientId );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( expected );
		}
	);
} );
