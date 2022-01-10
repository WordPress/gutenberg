/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';

describe( 'CustomSelectControl', () => {
	it( 'Captures the keypress event and does not let it propagate', () => {
		const onKeyDown = jest.fn();
		const options = [
			{
				key: 'one',
				name: 'Option one',
			},
			{
				key: 'two',
				name: 'Option two',
			},
			{
				key: 'three',
				name: 'Option three',
			},
		];

		render(
			<div
				// This role="none" is required to prevent an eslint warning about accessibility.
				role="none"
				onKeyDown={ onKeyDown }
			>
				<CustomSelectControl options={ options } />
			</div>
		);
		const toggleButton = screen.getByRole( 'button' );
		fireEvent.click( toggleButton );

		const customSelect = screen.getByRole( 'listbox' );
		fireEvent.keyDown( customSelect );

		expect( onKeyDown ).toHaveBeenCalledTimes( 0 );
	} );
} );
