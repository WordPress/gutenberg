/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
	ToggleGroupControlOptionIcon,
} from '../index';
import type { ToggleGroupControlProps } from '../types';

function getWrappingPopoverElement( element: HTMLElement ) {
	return element.closest( '.components-popover' );
}

const ControlledToggleGroupControl = ( {
	value: valueProp,
	onChange,
	...props
}: ToggleGroupControlProps ) => {
	const [ value, setValue ] = useState( valueProp );

	return (
		<ToggleGroupControl
			{ ...props }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange?.( ...changeArgs );
			} }
			value={ value }
		/>
	);
};

describe( 'ToggleGroupControl', () => {
	const options = (
		<>
			<ToggleGroupControlOption value="rigas" label="R" />
			<ToggleGroupControlOption value="jack" label="J" />
		</>
	);
	const optionsWithTooltip = (
		<>
			<ToggleGroupControlOption
				value="gnocchi"
				label="Delicious Gnocchi"
				aria-label="Click for Delicious Gnocchi"
				showTooltip={ true }
			/>
			<ToggleGroupControlOption
				value="caponata"
				label="Sumptuous Caponata"
				aria-label="Click for Sumptuous Caponata"
			/>
		</>
	);

	describe( 'should render correctly', () => {
		it( 'with text options', () => {
			const { container } = render(
				<ControlledToggleGroupControl label="Test Toggle Group Control">
					{ options }
				</ControlledToggleGroupControl>
			);

			expect( container ).toMatchSnapshot();
		} );

		it( 'with icons', () => {
			const { container } = render(
				<ControlledToggleGroupControl
					value="uppercase"
					label="Test Toggle Group Control"
				>
					<ToggleGroupControlOptionIcon
						value="uppercase"
						icon={ formatUppercase }
						label="Uppercase"
					/>
					<ToggleGroupControlOptionIcon
						value="lowercase"
						icon={ formatLowercase }
						label="Lowercase"
					/>
				</ControlledToggleGroupControl>
			);

			expect( container ).toMatchSnapshot();
		} );
	} );
	it( 'should call onChange with proper value', async () => {
		const user = userEvent.setup();
		const mockOnChange = jest.fn();

		render(
			<ControlledToggleGroupControl
				value="jack"
				onChange={ mockOnChange }
				label="Test Toggle Group Control"
			>
				{ options }
			</ControlledToggleGroupControl>
		);

		await user.click( screen.getByRole( 'radio', { name: 'R' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith( 'rigas' );
	} );

	it( 'should render tooltip where `showTooltip` === `true`', async () => {
		const user = userEvent.setup();
		render(
			<ControlledToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ControlledToggleGroupControl>
		);

		const firstRadio = screen.getByLabelText(
			'Click for Delicious Gnocchi'
		);

		await user.hover( firstRadio );

		const tooltip = await screen.findByText(
			'Click for Delicious Gnocchi'
		);

		await waitFor( () =>
			expect(
				getWrappingPopoverElement( tooltip )
			).toBePositionedPopover()
		);

		expect( tooltip ).toBeVisible();
	} );

	it( 'should not render tooltip', async () => {
		const user = userEvent.setup();
		render(
			<ControlledToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ControlledToggleGroupControl>
		);

		const secondRadio = screen.getByLabelText(
			'Click for Sumptuous Caponata'
		);

		await user.hover( secondRadio );

		await waitFor( () =>
			expect(
				screen.queryByText( 'Click for Sumptuous Caponata' )
			).not.toBeInTheDocument()
		);
	} );

	describe( 'isDeselectable', () => {
		describe( 'isDeselectable = false', () => {
			it( 'should not be deselectable', async () => {
				const mockOnChange = jest.fn();
				const user = userEvent.setup();

				render(
					<ControlledToggleGroupControl
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
					>
						{ options }
					</ControlledToggleGroupControl>
				);

				const rigas = screen.getByRole( 'radio', {
					name: 'R',
					checked: true,
				} );
				await user.click( rigas );
				expect( mockOnChange ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'should not tab to next radio option', async () => {
				const user = userEvent.setup();

				render(
					<ControlledToggleGroupControl value="rigas" label="Test">
						{ options }
					</ControlledToggleGroupControl>
				);

				const rigas = screen.getByRole( 'radio', {
					name: 'R',
				} );

				await user.tab();
				expect( rigas ).toHaveFocus();

				await user.tab();
				expect( rigas.ownerDocument.body ).toHaveFocus();
			} );
		} );

		describe( 'isDeselectable = true', () => {
			it( 'should be deselectable', async () => {
				const mockOnChange = jest.fn();
				const user = userEvent.setup();

				render(
					<ControlledToggleGroupControl
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
						isDeselectable
					>
						{ options }
					</ControlledToggleGroupControl>
				);

				await user.click(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: true,
					} )
				);
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenCalledWith( undefined );
				expect(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: false,
					} )
				).toBeVisible();
			} );

			it( 'should tab to the next option button', async () => {
				const user = userEvent.setup();

				render(
					<ControlledToggleGroupControl
						isDeselectable
						value="rigas"
						label="Test"
					>
						{ options }
					</ControlledToggleGroupControl>
				);

				await user.tab();
				expect(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: true,
					} )
				).toHaveFocus();

				await user.tab();
				expect(
					screen.getByRole( 'button', {
						name: 'J',
						pressed: false,
					} )
				).toHaveFocus();

				// Focus should not move with arrow keys
				await user.keyboard( '{ArrowLeft}' );
				expect(
					screen.getByRole( 'button', {
						name: 'J',
						pressed: false,
					} )
				).toHaveFocus();
			} );
		} );
	} );
} );
