/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { SegmentedControl, SegmentedControlOption } from '../index';

describe( 'SegmentedControl', () => {
	const options = (
		<>
			<SegmentedControlOption value="rigas" label="R" />
			<SegmentedControlOption value="jack" label="J" />
		</>
	);
	it( 'should render correctly', () => {
		const { container } = render(
			<SegmentedControl label="Test Segmented Control">
				{ options }
			</SegmentedControl>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
	it( 'should call onChange with proper value', () => {
		const mockOnChange = jest.fn();
		const { getByLabelText } = render(
			<SegmentedControl
				value="jack"
				onChange={ mockOnChange }
				label="Test Segmented Control"
			>
				{ options }
			</SegmentedControl>
		);
		const firstButton = getByLabelText( 'R' );
		fireEvent.click( firstButton );
		expect( mockOnChange ).toHaveBeenCalledWith( 'rigas' );
	} );
} );
