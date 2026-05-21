/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useOnEnter } from '../use-enter';

// Mock createBlock/getDefaultBlockName so tests don't need core blocks registered.
const mockCreateBlock = jest.fn( () => ( {
	clientId: 'new-block',
	name: 'core/paragraph',
	attributes: {},
	innerBlocks: [],
} ) );
const mockGetDefaultBlockName = jest.fn( () => 'core/paragraph' );

jest.mock( '@wordpress/blocks', () => ( {
	...jest.requireActual( '@wordpress/blocks' ),
	createBlock: ( ...args ) => mockCreateBlock( ...args ),
	getDefaultBlockName: () => mockGetDefaultBlockName(),
} ) );

describe( 'useOnEnter', () => {
	let element;

	beforeEach( async () => {
		element = document.createElement( 'p' );
		document.body.appendChild( element );
		mockCreateBlock.mockClear();
		mockGetDefaultBlockName.mockClear();
		await act( async () => {
			await dispatch( blockEditorStore ).updateSettings( {
				__experimentalCleanEmptyParagraphs: false,
			} );
		} );
	} );

	afterEach( () => {
		document.body.removeChild( element );
	} );

	function fireKeyDown( { shiftKey = false } = {} ) {
		// Use window.KeyboardEvent to avoid the `no-undef` lint error
		// (the strict ESLint config does not include browser globals).
		const event = new window.KeyboardEvent( 'keydown', {
			keyCode: ENTER,
			shiftKey,
			bubbles: true,
			cancelable: true,
		} );
		element.dispatchEvent( event );
		return event;
	}

	it( 'does not prevent Enter when setting is disabled (default)', () => {
		const { result } = renderHook( () =>
			useOnEnter( { clientId: 'test', content: '' } )
		);
		act( () => result.current( element ) );

		expect( fireKeyDown().defaultPrevented ).toBe( false );
	} );

	it( 'prevents Enter in empty paragraph when setting is enabled', async () => {
		await act( async () => {
			await dispatch( blockEditorStore ).updateSettings( {
				__experimentalCleanEmptyParagraphs: true,
			} );
		} );

		const { result } = renderHook( () =>
			useOnEnter( { clientId: 'test', content: '' } )
		);
		act( () => result.current( element ) );

		expect( fireKeyDown().defaultPrevented ).toBe( true );
	} );

	it( 'does not prevent Enter in non-empty paragraph when setting is enabled', async () => {
		await act( async () => {
			await dispatch( blockEditorStore ).updateSettings( {
				__experimentalCleanEmptyParagraphs: true,
			} );
		} );

		const { result } = renderHook( () =>
			useOnEnter( { clientId: 'test', content: 'Hello world' } )
		);
		act( () => result.current( element ) );

		expect( fireKeyDown().defaultPrevented ).toBe( false );
	} );

	it( 'prevents Shift+Enter, strips trailing <br>, and inserts new block when setting is enabled', async () => {
		await act( async () => {
			await dispatch( blockEditorStore ).updateSettings( {
				__experimentalCleanEmptyParagraphs: true,
			} );
		} );

		const setAttributes = jest.fn();
		const insertBlocksAfter = jest.fn();
		const { result } = renderHook( () =>
			useOnEnter( {
				clientId: 'test',
				content: 'Hello<br>',
				setAttributes,
				insertBlocksAfter,
			} )
		);
		act( () => result.current( element ) );

		expect( fireKeyDown( { shiftKey: true } ).defaultPrevented ).toBe(
			true
		);
		expect( setAttributes ).toHaveBeenCalledWith( { content: 'Hello' } );
		expect( insertBlocksAfter ).toHaveBeenCalled();
	} );

	it( 'does not prevent Shift+Enter when content does not end with <br>', async () => {
		await act( async () => {
			await dispatch( blockEditorStore ).updateSettings( {
				__experimentalCleanEmptyParagraphs: true,
			} );
		} );

		const { result } = renderHook( () =>
			useOnEnter( {
				clientId: 'test',
				content: 'Hello world',
				setAttributes: jest.fn(),
				insertBlocksAfter: jest.fn(),
			} )
		);
		act( () => result.current( element ) );

		expect( fireKeyDown( { shiftKey: true } ).defaultPrevented ).toBe(
			false
		);
	} );
} );
