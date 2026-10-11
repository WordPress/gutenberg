import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import { useRichText } from '../';

function record( text, start = text.length, end = start ) {
	return {
		text,
		formats: Array( text.length ),
		replacements: Array( text.length ),
		start,
		end,
	};
}

/**
 * Renders the hook on an editable element and returns a handle to the latest
 * hook result, so a test can send an edit the way input handling does.
 *
 * @param {Object} props Props for `useRichText`.
 */
function renderRichText( props ) {
	const onChange = vi.fn();
	const onSelectionChange = vi.fn();
	const handle = {};

	function Editable() {
		const { ref, onChange: handleChange } = useRichText( {
			onChange,
			onSelectionChange,
			...props,
		} );
		handle.edit = handleChange;
		return createElement( 'div', {
			ref,
			contentEditable: true,
			suppressContentEditableWarning: true,
		} );
	}

	const container = document.createElement( 'div' );
	const root = createRoot( container );
	const mount = ( node ) => root.render( node );
	act( () => mount( createElement( Editable ) ) );

	return {
		onChange,
		onSelectionChange,
		element: container.firstChild,
		edit: ( newRecord ) => act( () => handle.edit( newRecord ) ),
	};
}

describe( 'useRichText maxLength', () => {
	it( 'trims an edit that grows the text past maxLength', () => {
		const { edit, onChange } = renderRichText( {
			value: 'abcde',
			maxLength: 5,
		} );

		edit( record( 'abcdef' ) );

		expect( onChange ).toHaveBeenCalledWith(
			'abcde',
			expect.objectContaining( { __unstableText: 'abcde' } )
		);
	} );

	it( 'trims a long insertion to exactly maxLength, as a paste would', () => {
		const { edit, onChange, element } = renderRichText( {
			value: 'ab',
			maxLength: 5,
		} );

		edit( record( 'abcdefghij' ) );

		expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'abcde' );
		expect( element ).toHaveTextContent( 'abcde' );
	} );

	it( 'keeps the caret inside the trimmed text', () => {
		const { edit, onSelectionChange } = renderRichText( {
			value: 'abcde',
			maxLength: 5,
		} );

		edit( record( 'abcdefgh', 8 ) );

		expect( onSelectionChange ).toHaveBeenCalledWith( 5, 5 );
	} );

	it( 'keeps an initial value longer than maxLength', () => {
		const { element } = renderRichText( {
			value: 'abcdefgh',
			maxLength: 5,
		} );

		expect( element ).toHaveTextContent( 'abcdefgh' );
	} );

	it( 'does not let an over-long initial value grow', () => {
		const { edit, onChange } = renderRichText( {
			value: 'abcdefgh',
			maxLength: 5,
		} );

		edit( record( 'abcdefghi' ) );

		expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'abcdefgh' );
	} );

	it( 'allows edits that stay within maxLength', () => {
		const { edit, onChange } = renderRichText( {
			value: 'abc',
			maxLength: 5,
		} );

		edit( record( 'abcde' ) );

		expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'abcde' );
	} );

	it( 'does not limit the text when maxLength is not set', () => {
		const { edit, onChange } = renderRichText( { value: 'abc' } );

		edit( record( 'abcdefghij' ) );

		expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'abcdefghij' );
	} );
} );
