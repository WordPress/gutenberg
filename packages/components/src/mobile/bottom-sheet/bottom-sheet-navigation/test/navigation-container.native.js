/**
 * External dependencies
 */
import { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from 'test/helpers';

/**
 * Internal dependencies
 */
import NavigationContainer from '../navigation-container';
import NavigationScreen from '../navigation-screen';
import { performLayoutAnimation } from '../../../layout-animation';

jest.mock( '../../../layout-animation', () => ( {
	performLayoutAnimation: jest.fn(),
} ) );

const TestComponent = () => <Text>Test Component</Text>;

jest.useFakeTimers();

it( 'animates from full-screen to non-full-screen', async () => {
	const screen = render(
		<NavigationContainer main animate>
			<NavigationScreen name="test-screen-1">
				<TestComponent />
			</NavigationScreen>
		</NavigationContainer>
	);

	// Await navigation screen to allow async state updates to complete
	const navigationScreen = await waitFor( () =>
		screen.getByTestId( 'navigation-screen-test-screen-1' )
	);

	// Trigger full-screen layout
	act( () => {
		fireEvent( navigationScreen, 'layout', {
			nativeEvent: {
				layout: {
					/**
					 * onLayout would never provide a string height, but this is the most
					 * straightforward approach to recreating the desired testing context.
					 * The alternative would be `navigation.navigate` from a full-screen
					 * screen to a non-full-screen screen.
					 */
					height: '100%',
				},
			},
		} );
		jest.runAllTimers();
	} );

	// Trigger non-full-screen layout
	act( () => {
		fireEvent( navigationScreen, 'layout', {
			nativeEvent: {
				layout: {
					height: 123,
				},
			},
		} );
		jest.runAllTimers();
	} );

	expect( performLayoutAnimation ).toHaveBeenCalledTimes( 2 );
} );
