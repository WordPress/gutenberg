/**
 * External dependencies
 */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ToggleGroupControl, ToggleGroupControlOption } from '../index';

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
	it( 'should render correctly', () => {
		const { container } = render(
			<ToggleGroupControl label="Test Toggle Group Control">
				{ options }
			</ToggleGroupControl>
		);
		expect( container.firstChild ).toMatchSnapshot();
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
	it( 'should render tooltip where `showTooltip` === `true`', async () => {
		render(
			<ToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ToggleGroupControl>
		);
		const firstRadio = screen.getByLabelText(
			'Click for Delicious Gnocchi'
		);
		fireEvent.mouseOver( firstRadio );
		await waitFor( () =>
			expect(
				screen.getByText( 'Click for Delicious Gnocchi' )
			).toBeInTheDocument()
		);
	} );
	it( 'should not render tooltip', async () => {
		render(
			<ToggleGroupControl label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</ToggleGroupControl>
		);
		const secondRadio = screen.getByLabelText(
			'Click for Sumptuous Caponata'
		);
		fireEvent.mouseOver( secondRadio );
		await waitFor( () =>
			expect(
				screen.queryByText( 'Click for Sumptuous Caponata' )
			).not.toBeInTheDocument()
		);
	} );
} );
