/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import { SegmentedControl } from '../index';

describe( 'SegmentedControl', () => {
	const options = (
		<>
			<SegmentedControl.Option value="olaf" label="O" />
			<SegmentedControl.Option value="samantha" label="S" />
		</>
	);
	it( 'should render correctly', () => {
		const { container } = render(
			<SegmentedControl
				baseId="segmented"
				options={ options }
				label="Test Segmented Control"
			>
				{ options }
			</SegmentedControl>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
	it( 'should call onChange with proper value', () => {
		let container;
		const mockOnChange = jest.fn();
		act( () => {
			( { container } = render(
				<SegmentedControl
					baseId="segmented"
					value="samantha"
					onChange={ mockOnChange }
					label="Test Segmented Control"
				>
					{ options }
				</SegmentedControl>
			) );
		} );
		const firstButton = container.querySelector( 'button[aria-label="O"]' );
		act( () => {
			Simulate.click( firstButton );
		} );
		expect( mockOnChange ).toHaveBeenCalledWith( 'olaf' );
	} );
} );
