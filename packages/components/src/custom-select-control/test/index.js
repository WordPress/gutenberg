/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import CustomSelectControl from '..';

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
				<CustomSelectControl
					options={ options }
					__nextUnconstrainedWidth
				/>
			</div>
		);
		const toggleButton = screen.getByRole( 'button' );
		fireEvent.click( toggleButton );

		const customSelect = screen.getByRole( 'listbox' );
		fireEvent.keyDown( customSelect );

		expect( onKeyDown ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'does not show selected hint by default', () => {
		render(
			<CustomSelectControl
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						__experimentalHint: 'Hint',
					},
				] }
				__nextUnconstrainedWidth
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Custom select' } )
		).not.toHaveTextContent( 'Hint' );
	} );

	it( 'shows selected hint when __experimentalShowSelectedHint is set', () => {
		render(
			<CustomSelectControl
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						__experimentalHint: 'Hint',
					},
				] }
				__experimentalShowSelectedHint
				__nextUnconstrainedWidth
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Custom select' } )
		).toHaveTextContent( 'Hint' );
	} );
} );
