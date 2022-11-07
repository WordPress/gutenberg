/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { formatUppercase } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ToggleMultipleGroupControl from '../component';
import { ToggleMultipleGroupControlOptionIcon } from '../option-icon';

const TestComponent = () => {
	const [ uppercase, setIsUppercase ] = useState( false );
	const [ lowercase, setIsLowercase ] = useState( false );

	return (
		<ToggleMultipleGroupControl label="Label">
			<ToggleMultipleGroupControlOptionIcon
				value="uppercase"
				icon={ formatUppercase }
				label="Uppercase"
				isPressed={ uppercase }
				onClick={ () => setIsUppercase( ! uppercase ) }
			/>
			<ToggleMultipleGroupControlOptionIcon
				value="lowercase"
				icon={ formatUppercase }
				label="Lowercase"
				isPressed={ lowercase }
				onClick={ () => setIsLowercase( ! lowercase ) }
			/>
		</ToggleMultipleGroupControl>
	);
};

describe( 'ToggleMultipleGroupControl', () => {
	it( 'should allow multiple selection', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestComponent /> );

		await user.click( screen.getByRole( 'button', { name: 'Uppercase' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Lowercase' } ) );

		expect(
			screen.getByRole( 'button', { name: 'Uppercase', pressed: true } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Lowercase', pressed: true } )
		).toBeInTheDocument();

		// Deselecting should work
		await user.click( screen.getByRole( 'button', { name: 'Uppercase' } ) );

		expect(
			screen.getByRole( 'button', { name: 'Uppercase', pressed: false } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Lowercase', pressed: true } )
		).toBeInTheDocument();
	} );
} );
