/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';
/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';

describe( 'CustomSelectControl', () => {
	const onKeyDown = jest.fn();

	it( 'Captures the keypress event and does not let it propagate', () => {
		const wrapper = (
			<div
				role="none"
				className="test-class-name"
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
