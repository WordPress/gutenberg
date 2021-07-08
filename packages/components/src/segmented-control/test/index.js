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
	const options = [
		{ value: 'olaf', label: 'O' },
		{ value: 'samantha', label: 'S' },
	];

	it( 'should render correctly', () => {
		const { container } = render(
			<SegmentedControl
				baseId="segmented"
				options={ options }
				label="Test Segmented Control"
			/>
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
					options={ options }
					value={ options[ 1 ].value }
					onChange={ mockOnChange }
					label="Test Segmented Control"
				/>
			) );
		} );
		const firstButton = container.querySelector(
			`button[aria-label="${ options[ 0 ].label }"]`
		);
		act( () => {
			Simulate.click( firstButton );
		} );
		expect( mockOnChange ).toHaveBeenCalledWith( options[ 0 ].value );
	} );
} );
