/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Elevation } from '..';

const getGeneratedEmotionClassNames = ( element: HTMLElement ) =>
	Array.from( element.classList ).filter( ( className ) =>
		/^(css|emotion)-/.test( className )
	);

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

	test( 'should compose interactive styles in a single generated class', () => {
		render(
			<Elevation
				active={ 5 }
				focus={ 9 }
				hover={ 14 }
				value={ 7 }
				data-testid="elevation"
			/>
		);

		expect(
			getGeneratedEmotionClassNames( screen.getByTestId( 'elevation' ) )
		).toHaveLength( 1 );
	} );
} );
