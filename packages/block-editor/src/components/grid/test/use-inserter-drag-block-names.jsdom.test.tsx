import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { useInserterDragBlockNames } from '../use-inserter-drag-block-names';

function setUp() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const gridElement = document.createElement( 'div' );
	document.body.appendChild( gridElement );
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<RegistryProvider value={ registry }>{ children }</RegistryProvider>
	);
	const { result } = renderHook(
		() => useInserterDragBlockNames( gridElement ),
		{ wrapper }
	);
	return { registry, gridElement, result };
}

function fireDragEvent( target: EventTarget, type: string, types: string[] ) {
	const event = new window.Event( type, { bubbles: true } );
	Object.defineProperty( event, 'dataTransfer', { value: { types } } );
	act( () => {
		target.dispatchEvent( event );
	} );
}

describe( 'useInserterDragBlockNames', () => {
	it( 'reads the names from the first dragover while dragging', () => {
		const { registry, gridElement, result } = setUp();
		expect( result.current ).toEqual( [] );
		act( () => {
			unlock( registry.dispatch( blockEditorStore ) ).startDragging();
		} );
		fireDragEvent( gridElement, 'dragover', [
			'wp-blocks',
			'wp-block:core/paragraph',
		] );
		expect( result.current ).toEqual( [ 'core/paragraph' ] );
	} );

	it( 'keeps the names after a dragleave', () => {
		const { registry, gridElement, result } = setUp();
		act( () => {
			unlock( registry.dispatch( blockEditorStore ) ).startDragging();
		} );
		fireDragEvent( gridElement, 'dragover', [ 'wp-block:core/image' ] );
		fireDragEvent( gridElement, 'dragleave', [ 'wp-block:core/image' ] );
		expect( result.current ).toEqual( [ 'core/image' ] );
	} );

	it( 'resets once the drag ends', () => {
		const { registry, gridElement, result } = setUp();
		act( () => {
			unlock( registry.dispatch( blockEditorStore ) ).startDragging();
		} );
		fireDragEvent( gridElement, 'dragover', [ 'wp-block:core/image' ] );
		act( () => {
			unlock( registry.dispatch( blockEditorStore ) ).stopDragging();
		} );
		expect( result.current ).toEqual( [] );
	} );

	it( 'ignores events while blocks from the canvas are dragged', () => {
		const { registry, gridElement, result } = setUp();
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.startDraggingBlocks( [ 'block' ] );
			unlock( registry.dispatch( blockEditorStore ) ).startDragging();
		} );
		fireDragEvent( gridElement, 'dragover', [ 'wp-block:core/image' ] );
		expect( result.current ).toEqual( [] );
	} );
} );
