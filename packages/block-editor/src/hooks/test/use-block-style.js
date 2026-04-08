/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useBlockStyle } from '../use-block-style';
import { BlockEditContextProvider } from '../../components/block-edit/context';

describe( 'useBlockStyle', () => {
	beforeAll( () => {
		registerBlockType( 'test/style-block', {
			apiVersion: 3,
			title: 'Style Block',
			category: 'text',
			attributes: {
				style: { type: 'object' },
			},
			edit: () => null,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/style-block' );
		dispatch( blockEditorStore ).resetBlocks( [] );
	} );

	let clientId;
	beforeEach( async () => {
		const block = createBlock( 'test/style-block', {
			style: {
				color: { text: '#000000' },
				':hover': { color: { text: '#ff0000' } },
			},
		} );
		await dispatch( blockEditorStore ).resetBlocks( [ block ] );
		clientId = block.clientId;
	} );

	afterEach( () => {
		dispatch( blockEditorStore ).resetBlocks( [] );
	} );

	function makeWrapper( id ) {
		return function Wrapper( { children } ) {
			return createElement(
				BlockEditContextProvider,
				{
					value: {
						clientId: id,
						name: 'test/style-block',
						isSelected: true,
					},
				},
				children
			);
		};
	}

	describe( 'reading values', () => {
		it( 'reads a value from the default state via dot-notation path', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			expect( result.current[ 0 ] ).toBe( '#000000' );
		} );

		it( 'reads a value from the default state via array path', () => {
			const { result } = renderHook(
				() => useBlockStyle( [ 'color', 'text' ] ),
				{ wrapper: makeWrapper( clientId ) }
			);

			expect( result.current[ 0 ] ).toBe( '#000000' );
		} );

		it( 'treats state "default" the same as no state', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text', 'default' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			expect( result.current[ 0 ] ).toBe( '#000000' );
		} );

		it( 'reads a value scoped to a pseudo-state via dot-notation path', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text', ':hover' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			expect( result.current[ 0 ] ).toBe( '#ff0000' );
		} );

		it( 'reads the full state sub-object when path is null', () => {
			const { result } = renderHook(
				() => useBlockStyle( null, ':hover' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			expect( result.current[ 0 ] ).toEqual( {
				color: { text: '#ff0000' },
			} );
		} );
	} );

	describe( 'writing values', () => {
		it( 'writes a value to the default state without affecting pseudo-state styles', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			act( () => {
				result.current[ 1 ]( '#ffffff' );
			} );

			const { style } =
				select( blockEditorStore ).getBlockAttributes( clientId );
			expect( style.color.text ).toBe( '#ffffff' );
			expect( style[ ':hover' ].color.text ).toBe( '#ff0000' );
		} );

		it( 'writes a value to a pseudo-state without affecting the default state', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text', ':hover' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			act( () => {
				result.current[ 1 ]( '#0000ff' );
			} );

			const { style } =
				select( blockEditorStore ).getBlockAttributes( clientId );
			expect( style[ ':hover' ].color.text ).toBe( '#0000ff' );
			expect( style.color.text ).toBe( '#000000' );
		} );

		it( 'replaces the full state sub-object when path is null', () => {
			const { result } = renderHook(
				() => useBlockStyle( null, ':hover' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			act( () => {
				result.current[ 1 ]( { color: { text: '#0000ff' } } );
			} );

			const { style } =
				select( blockEditorStore ).getBlockAttributes( clientId );
			expect( style[ ':hover' ] ).toEqual( {
				color: { text: '#0000ff' },
			} );
			expect( style.color.text ).toBe( '#000000' );
		} );

		it( 'removes the state key when the last value inside it is cleared', () => {
			const { result } = renderHook(
				() => useBlockStyle( 'color.text', ':hover' ),
				{ wrapper: makeWrapper( clientId ) }
			);

			act( () => {
				result.current[ 1 ]( undefined );
			} );

			const { style } =
				select( blockEditorStore ).getBlockAttributes( clientId );
			expect( style[ ':hover' ] ).toBeUndefined();
			// Default-state styles must be left intact.
			expect( style.color.text ).toBe( '#000000' );
		} );
	} );
} );
