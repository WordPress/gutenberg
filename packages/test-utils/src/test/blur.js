/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import blur from '../blur';

describe( 'blur', () => {
	it( 'should blur focused button', async () => {
		// eslint-disable-next-line jsx-a11y/no-autofocus
		const { getByText } = render( <button autoFocus>button</button> );
		const button = getByText( 'button' );

		expect( button ).toHaveFocus();
		blur( button );
		expect( document.body ).toHaveFocus();
	} );
} );
