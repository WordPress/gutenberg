import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToolbarMode } from '../use-toolbar-mode';

type Props = { clientId?: string; isTextSelected?: boolean };

const setup = ( initialProps: Props ) =>
	renderHook(
		( { clientId, isTextSelected }: Props ) =>
			useToolbarMode( clientId, isTextSelected ),
		{ initialProps }
	);

describe( 'useToolbarMode', () => {
	it( 'starts out designing when the selection is not in text', () => {
		const { result } = setup( { clientId: 'block-1' } );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'starts out writing when the selection is already in text', () => {
		const { result } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );
		expect( result.current[ 0 ] ).toBe( 'write' );
	} );

	it( 'switches to writing when the caret lands in the block’s text', () => {
		const { result, rerender } = setup( { clientId: 'block-1' } );
		expect( result.current[ 0 ] ).toBe( 'design' );

		rerender( { clientId: 'block-1', isTextSelected: true } );
		expect( result.current[ 0 ] ).toBe( 'write' );
	} );

	it( 'goes back to designing when the selection leaves the text', () => {
		const { result, rerender } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );

		rerender( { clientId: 'block-1', isTextSelected: false } );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'keeps the mode you chose while the selection is unchanged', () => {
		const { result, rerender } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );

		act( () => result.current[ 1 ]( 'design' ) );
		expect( result.current[ 0 ] ).toBe( 'design' );

		rerender( { clientId: 'block-1', isTextSelected: true } );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'starts again on the next block, writing if the caret is in its text', () => {
		const { result, rerender } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );

		act( () => result.current[ 1 ]( 'design' ) );
		rerender( { clientId: 'block-2', isTextSelected: true } );

		expect( result.current[ 0 ] ).toBe( 'write' );
	} );

	it( 'starts again on the next block, designing if it has no text caret', () => {
		const { result, rerender } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );

		rerender( { clientId: 'block-2', isTextSelected: false } );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'goes back to designing when the selection is cleared', () => {
		const { result, rerender } = setup( {
			clientId: 'block-1',
			isTextSelected: true,
		} );

		rerender( { clientId: undefined, isTextSelected: false } );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );
} );
