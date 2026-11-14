import { afterEach, describe, expect, it, vi } from 'vitest';
import { ownsSelection } from '../owns-selection';

function createEditable() {
	const element = document.createElement( 'div' );
	// jsdom does not implement `contentEditable`.
	Object.defineProperty( element, 'contentEditable', { value: 'true' } );
	return element;
}

describe( 'ownsSelection', () => {
	afterEach( () => {
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	} );

	it( 'should return false when there is no selection', () => {
		const host = createEditable();
		const element = createEditable();
		host.tabIndex = 0;
		host.append( element );
		document.body.append( host );
		host.focus();
		vi.spyOn( window, 'getSelection' ).mockReturnValue( null );

		expect( host ).toHaveFocus();
		expect( ownsSelection( element ) ).toBe( false );
	} );
} );
