/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import useResizeObserver from '../';

const TestComponent = ( { onLayout } ) => {
	const [ resizeObserver, sizes ] = useResizeObserver();

	return (
		<View sizes={ sizes } onLayout={ onLayout }>
			{ resizeObserver }
		</View>
	);
};

const renderWithOnLayout = ( component ) => {
	const testComponent = create( component );

	const mockNativeEvent = {
		nativeEvent: {
			layout: {
				width: 300,
				height: 500,
			},
		},
	};

	act( () => {
		testComponent.toJSON().children[ 0 ].props.onLayout( mockNativeEvent );
	} );

	return testComponent.toJSON();
};

describe( 'useResizeObserver()', () => {
	it( 'should return "{ width: 300, height: 500 }"', () => {
		const component = renderWithOnLayout( <TestComponent /> );

		expect( component.props.sizes ).toMatchObject( {
			width: 300,
			height: 500,
		} );
	} );
} );
