/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import CustomSelectControl from '..';

const options = [
	{
		key: 'violets',
		name: 'violets',
	},
	{
		key: 'crimson clover',
		name: 'crimson clover',
	},
	{
		key: 'poppy',
		name: 'poppy',
	},
];

describe( 'CustomSelectControl', () => {
	it( 'Captures the keypress event and does not let it propagate', async () => {
		const user = userEvent.setup();
		const onKeyDown = jest.fn();

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
		await user.click( toggleButton );

		const customSelect = screen.getByRole( 'listbox' );
		await user.type( customSelect, '{enter}' );

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

	it( 'Initial value should be replaced when a new item is selected', async () => {
		const user = userEvent.setup();
		const mock = jest.fn();

		render(
			<CustomSelectControl
				onChange={ ( { selectedItem } ) => mock( selectedItem ) }
				options={ options }
				__nextUnconstrainedWidth
			/>
		);

		const currentValue = screen.getByRole( 'button' );

		expect( currentValue ).toHaveTextContent( /violets/i );

		await user.click( currentValue );

		const newValue = screen.getByRole( 'option', {
			name: /poppy/i,
		} );

		await user.click( newValue );

		expect( currentValue ).toHaveTextContent( /poppy/i );
		expect( mock ).toHaveBeenCalled();
	} );

	it( 'Should be able to change selection using keyboard', async () => {
		const user = userEvent.setup();

		render(
			<CustomSelectControl options={ options } __nextUnconstrainedWidth />
		);

		const currentValue = screen.getByRole( 'button' );
		expect( currentValue ).toHaveTextContent( /violets/i );

		await user.tab();
		expect( currentValue ).toHaveFocus();

		await user.keyboard( '{enter}' );
		await user.keyboard( '{arrowdown}' );
		await user.keyboard( '{enter}' );

		expect( currentValue ).toHaveTextContent( /crimson clover/i );
	} );

	it( 'Should keep current selection if dropdown is closed without changing selection', async () => {
		const user = userEvent.setup();

		render(
			<CustomSelectControl options={ options } __nextUnconstrainedWidth />
		);

		const currentValue = screen.getByRole( 'button' );
		expect( currentValue ).toHaveTextContent( /violets/i );

		await user.tab();
		await user.keyboard( '{enter}' );
		expect( screen.getByRole( 'listbox' ) ).toBeVisible();
		expect( screen.getByRole( 'listbox' ) ).toHaveAttribute(
			'aria-hidden',
			'false'
		);
		await user.keyboard( '{escape}' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

		expect( currentValue ).toHaveTextContent( /violets/i );
	} );

	it( 'Should be able to type characters to select matching options', async () => {
		const user = userEvent.setup();

		render(
			<CustomSelectControl options={ options } __nextUnconstrainedWidth />
		);

		const currentValue = screen.getByRole( 'button' );
		expect( currentValue ).toHaveTextContent( /violets/i );

		await user.tab();
		await user.keyboard( '{enter}' );
		await user.keyboard( '{p}' );
		await user.keyboard( '{enter}' );

		expect( currentValue ).toHaveTextContent( /poppy/i );
	} );

	it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
		const user = userEvent.setup();

		render(
			<CustomSelectControl options={ options } __nextUnconstrainedWidth />
		);

		const currentValue = screen.getByRole( 'button' );
		expect( currentValue ).toHaveTextContent( /violets/i );

		await user.tab();
		await user.keyboard( '{c}' );
		await user.keyboard( '{enter}' );

		expect( currentValue ).toHaveTextContent( /crimson clover/i );
	} );

	it( 'Current selection has attribute: aria-selected="true"', async () => {
		const user = userEvent.setup();

		render(
			<CustomSelectControl options={ options } __nextUnconstrainedWidth />
		);

		await user.tab();
		await user.keyboard( '{enter}' );

		expect(
			screen.getByRole( 'option', {
				name: /violets/i,
			} )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );
} );
