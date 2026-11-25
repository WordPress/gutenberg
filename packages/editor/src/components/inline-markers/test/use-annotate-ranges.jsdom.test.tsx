import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as annotationsStore } from '@wordpress/annotations';
import { useAnnotateRanges } from '../use-annotate-ranges';

const range = ( id: string, start: number, end: number ) => ( {
	id,
	clientId: 'block',
	attributeKey: 'content',
	start,
	end,
} );

function setup( initialRanges: any[] ) {
	const registry = createRegistry();
	registry.register( annotationsStore );
	let changes = 0;
	registry.subscribe( () => changes++, annotationsStore );
	const view = renderHook(
		( { ranges } ) => useAnnotateRanges( 'core-test', ranges ),
		{
			initialProps: { ranges: initialRanges },
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		}
	);
	const annotations = () =>
		registry
			.select( annotationsStore )
			.__experimentalGetAllAnnotationsForBlock( 'block' );
	return {
		...view,
		annotations,
		changes: () => changes,
		resetChanges: () => ( changes = 0 ),
	};
}

describe( 'useAnnotateRanges', () => {
	it( 'registers the ranges under the source', () => {
		const { annotations } = setup( [ range( '1', 0, 3 ) ] );
		expect( annotations() ).toMatchObject( [
			{ id: '1', source: 'core-test', range: { start: 0, end: 3 } },
		] );
	} );

	it( 'moves a range with a single store change', () => {
		const { annotations, rerender, changes, resetChanges } = setup( [
			range( '1', 0, 3 ),
		] );
		resetChanges();
		rerender( { ranges: [ range( '1', 0, 4 ) ] } );
		expect( changes() ).toBe( 1 );
		expect( annotations() ).toMatchObject( [
			{ id: '1', range: { start: 0, end: 4 } },
		] );
	} );

	it( 'replaces the set with a single store change when ranges come and go', () => {
		const { annotations, rerender, changes, resetChanges } = setup( [
			range( '1', 0, 3 ),
		] );
		resetChanges();
		rerender( { ranges: [ range( '2', 5, 8 ) ] } );
		expect( changes() ).toBe( 1 );
		expect( annotations() ).toMatchObject( [
			{ id: '2', range: { start: 5, end: 8 } },
		] );
	} );

	it( 'clears the source on unmount', () => {
		const { annotations, unmount } = setup( [ range( '1', 0, 3 ) ] );
		unmount();
		expect( annotations() ).toEqual( [] );
	} );
} );
