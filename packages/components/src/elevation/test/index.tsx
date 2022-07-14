/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Elevation } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Elevation data-testid="elevation" /> );

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );

	test( 'should render isInteractive', () => {
		render( <Elevation isInteractive data-testid="elevation" /> );

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );

	test( 'should render value', () => {
		render( <Elevation value={ 7 } data-testid="elevation" /> );

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );

	test( 'should render hover', () => {
		render(
			<Elevation hover={ 14 } value={ 7 } data-testid="elevation" />
		);

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );

	test( 'should render active', () => {
		render(
			<Elevation
				active={ 5 }
				hover={ 14 }
				value={ 7 }
				data-testid="elevation"
			/>
		);

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );

	test( 'should render offset', () => {
		render(
			<Elevation
				active={ 5 }
				hover={ 14 }
				offset={ -2 }
				value={ 7 }
				data-testid="elevation"
			/>
		);

		expect( screen.getByTestId( 'elevation' ) ).toMatchSnapshot();
	} );
} );
