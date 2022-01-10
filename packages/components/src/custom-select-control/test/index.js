/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';
/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';

describe( 'CustomSelectControl', () => {
	it( 'Captures the keypress event and does not let it propagate', () => {
		const onKeyDown = jest.fn();
		const wrapper = (
			<div
				// This role="none" is required to prevent an eslint warning about accessibility.
				role="none"
				onKeyDown={ onKeyDown }
			>
				<CustomSelectControl options={ [ 'a', 'b', 'c' ] } />
			</div>
		);
		const { container } = render( wrapper );
		fireEvent.keyDown(
			container.getElementsByClassName(
				'components-custom-select-control__menu'
			)[ 0 ]
		);
		expect( onKeyDown.mock.calls.length ).toBe( 0 );
	} );
} );
