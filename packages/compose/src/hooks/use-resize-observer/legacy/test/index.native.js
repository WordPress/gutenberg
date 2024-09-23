/**
 * External dependencies
 */
import { render, fireEvent } from 'test/helpers';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import useResizeObserver from '..';

const TestComponent = ( { onLayout } ) => {
	const [ resizeObserver, sizes ] = useResizeObserver();

	return (
		<View testID="test-component" sizes={ sizes } onLayout={ onLayout }>
			{ resizeObserver }
		</View>
	);
};

describe( 'useResizeObserver()', () => {
	it( 'should return "{ width: 300, height: 500 }"', () => {
		const mockNativeEvent = {
			nativeEvent: {
				layout: {
					width: 300,
					height: 500,
				},
			},
		};

		const { getByTestId } = render(
			<TestComponent onLayout={ mockNativeEvent } />
		);

		const resizeObserver = getByTestId( 'resize-observer' );
		fireEvent( resizeObserver, 'layout', mockNativeEvent );

		const testComponent = getByTestId( 'test-component' );
		expect( testComponent.props.sizes ).toMatchObject( {
			width: 300,
			height: 500,
		} );
	} );
} );
