/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { formatLowercase, formatUppercase } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
	ToggleGroupControlOptionIcon,
} from '../index';

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
				<ToggleGroupControl label="Test Toggle Group Control">
					{ options }
				</ToggleGroupControl>
			);

			expect( container.firstChild ).toMatchSnapshot();
		} );
		it( 'with icons', () => {
			const { container } = render(
				<ToggleGroupControl
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
				</ToggleGroupControl>
			);

			expect( container.firstChild ).toMatchSnapshot();
		} );
	} );
	it( 'should call onChange with proper value', () => {
		const mockOnChange = jest.fn();

		render(
			<ToggleGroupControl
				value="jack"
				onChange={ mockOnChange }
				label="Test Toggle Group Control"
			>
				{ options }
			</ToggleGroupControl>
		);

		const firstRadio = screen.getByRole( 'radio', { name: 'R' } );

		fireEvent.click( firstRadio );

		expect( mockOnChange ).toHaveBeenCalledWith( 'rigas' );
	} );
	it( 'should render tooltip where `showTooltip` === `true`', () => {
		render(
			<ToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ToggleGroupControl>
		);

		const firstRadio = screen.getByLabelText(
			'Click for Delicious Gnocchi'
		);

		fireEvent.focus( firstRadio );

		expect(
			screen.getByText( 'Click for Delicious Gnocchi' )
		).toBeInTheDocument();
	} );

	it( 'should not render tooltip', () => {
		render(
			<ToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ToggleGroupControl>
		);

		const secondRadio = screen.getByLabelText(
			'Click for Sumptuous Caponata'
		);

		fireEvent.focus( secondRadio );

		expect(
			screen.queryByText( 'Click for Sumptuous Caponata' )
		).not.toBeInTheDocument();
	} );

	describe( 'isDeselectable', () => {
		describe( 'isDeselectable = false', () => {
			it( 'should not be deselectable', async () => {
				const mockOnChange = jest.fn();
				const user = userEvent.setup( {
					advanceTimers: jest.advanceTimersByTime,
				} );

				render(
					<ToggleGroupControl
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
					>
						{ options }
					</ToggleGroupControl>
				);

				const rigas = screen.getByRole( 'radio', {
					name: 'R',
					checked: true,
				} );
				await user.click( rigas );
				expect( mockOnChange ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'should not tab to next radio option', async () => {
				const user = userEvent.setup( {
					advanceTimers: jest.advanceTimersByTime,
				} );

				render(
					<ToggleGroupControl value="rigas" label="Test">
						{ options }
					</ToggleGroupControl>
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
			it( 'should  be deselectable', async () => {
				const mockOnChange = jest.fn();
				const user = userEvent.setup( {
					advanceTimers: jest.advanceTimersByTime,
				} );

				render(
					<ToggleGroupControl
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
						isDeselectable
					>
						{ options }
					</ToggleGroupControl>
				);

				await user.click(
					await screen.findByRole( 'button', {
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
				).toBeInTheDocument();
			} );

			it( 'should tab to the next option button', async () => {
				const user = userEvent.setup( {
					advanceTimers: jest.advanceTimersByTime,
				} );

				render(
					<ToggleGroupControl
						isDeselectable
						value="rigas"
						label="Test"
					>
						{ options }
					</ToggleGroupControl>
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
