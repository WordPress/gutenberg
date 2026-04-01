/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useAnchor } from '../hook/use-anchor';

describe( 'useAnchor', () => {
	it( 'should not throw when settings are not provided and cursor is inside a nested element', () => {
		// Set up a nested DOM structure: editable > strong > text
		const editable = document.createElement( 'div' );
		const strong = document.createElement( 'strong' );
		const text = document.createTextNode( 'hello' );
		strong.appendChild( text );
		editable.appendChild( strong );
		document.body.appendChild( editable );

		// Place cursor inside the <strong> element
		const range = document.createRange();
		range.setStart( text, 2 );
		range.setEnd( text, 2 );

		const mockSelection = {
			rangeCount: 1,
			getRangeAt: () => range,
		};
		jest.spyOn( window, 'getSelection' ).mockReturnValue(
			mockSelection as unknown as Selection
		);

		// Should not throw even though settings is undefined (empty selector)
		expect( () => {
			renderHook( () =>
				useAnchor( { editableContentElement: editable } )
			);
		} ).not.toThrow();

		document.body.removeChild( editable );
		jest.restoreAllMocks();
	} );
} );
