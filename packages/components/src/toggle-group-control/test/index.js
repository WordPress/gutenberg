/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

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
		const { getByLabelText } = render(
			<ToggleGroupControl
				value="jack"
				onChange={ mockOnChange }
				label="Test Toggle Group Control"
			>
				{ options }
			</ToggleGroupControl>
		);
		const firstButton = getByLabelText( 'R' );
		fireEvent.click( firstButton );
		expect( mockOnChange ).toHaveBeenCalledWith( 'rigas' );
	} );
} );
