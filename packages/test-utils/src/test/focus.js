/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import focus from '../focus';

describe( 'focus', () => {
	it( 'should focus button', () => {
		const { getByText } = render( <button>button</button> );
		const button = getByText( 'button' );
		expect( button ).not.toHaveFocus();
		focus( button );
		expect( button ).toHaveFocus();
	} );
} );
