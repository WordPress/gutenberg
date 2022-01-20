/**
 * External dependencies
 */
import { Text } from 'react-native';
import { render, fireEvent, waitFor, act } from 'test/helpers';
import { useNavigation } from '@react-navigation/native';

/**
 * Internal dependencies
 */
import NavigationContainer from '../navigation-container';
import NavigationScreen from '../navigation-screen';
import { performLayoutAnimation } from '../../../layout-animation';

jest.mock( '../../../layout-animation', () => ( {
	performLayoutAnimation: jest.fn(),
} ) );

const TestScreen = ( { fullScreen, name, navigateTo } ) => {
	const navigation = useNavigation();
	return (
		<NavigationScreen fullScreen={ fullScreen } name={ name }>
			<Text onPress={ () => navigation.navigate( navigateTo ) }>
				{ name }
			</Text>
		</NavigationScreen>
	);
};

jest.useFakeTimers( 'legacy' );

it( 'animates height transitioning from non-full-screen to full-screen', async () => {
	const screen = render(
		<NavigationContainer main animate>
			<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
			<TestScreen
				name="test-screen-2"
				navigateTo="test-screen-1"
				fullScreen
			/>
		</NavigationContainer>
	);

	// Await navigation screen to allow async state updates to complete
	const navigationScreen = await waitFor( () =>
		screen.getByTestId( 'navigation-screen-test-screen-1' )
	);
	// Trigger non-full-screen layout event
	act( () => {
		fireEvent( navigationScreen, 'layout', {
			nativeEvent: {
				layout: {
					height: 123,
				},
			},
		} );
		// Trigger debounced setting of height after layout event
		jest.advanceTimersByTime( 10 );
	} );
	// Navigate to screen 2
	fireEvent.press(
		await waitFor( () => screen.getByText( /test-screen-1/ ) )
	);
	// Await navigation screen to allow async state updates to complete
	await waitFor( () => screen.getByText( /test-screen-2/ ) );

	expect( performLayoutAnimation ).toHaveBeenCalledTimes( 1 );
} );

it( 'animates height transitioning from full-screen to non-full-screen', async () => {
	const screen = render(
		<NavigationContainer main animate>
			<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
			<TestScreen
				name="test-screen-2"
				navigateTo="test-screen-1"
				fullScreen
			/>
		</NavigationContainer>
	);

	// Await navigation screen to allow async state updates to complete
	const navigationScreen = await waitFor( () =>
		screen.getByTestId( 'navigation-screen-test-screen-1' )
	);
	// Trigger non-full-screen layout event
	act( () => {
		fireEvent( navigationScreen, 'layout', {
			nativeEvent: {
				layout: {
					height: 123,
				},
			},
		} );
		// Trigger debounced setting of height after layout event
		jest.advanceTimersByTime( 10 );
	} );
	// Navigate to screen 2
	fireEvent.press(
		await waitFor( () => screen.getByText( /test-screen-1/ ) )
	);
	// Navigate to screen 1
	fireEvent.press(
		// Use custom waitFor due to https://git.io/JYYGE
		await waitFor( () => screen.getByText( /test-screen-2/ ) )
	);
	// Await navigation screen to allow async state updates to complete
	await waitFor( () => screen.getByText( /test-screen-1/ ) );

	expect( performLayoutAnimation ).toHaveBeenCalledTimes( 2 );
} );

it( 'does not animate height transitioning from full-screen to full-screen', async () => {
	const screen = render(
		<NavigationContainer main animate>
			<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
			<TestScreen
				name="test-screen-2"
				navigateTo="test-screen-3"
				fullScreen
			/>
			<TestScreen
				name="test-screen-3"
				navigateTo="test-screen-2"
				fullScreen
			/>
		</NavigationContainer>
	);

	// Await navigation screen to allow async state updates to complete
	const navigationScreen = await waitFor( () =>
		screen.getByTestId( 'navigation-screen-test-screen-1' )
	);
	// Trigger non-full-screen layout event
	act( () => {
		fireEvent( navigationScreen, 'layout', {
			nativeEvent: {
				layout: {
					height: 123,
				},
			},
		} );
		// Trigger debounced setting of height after layout event
		jest.advanceTimersByTime( 10 );
	} );
	// Navigate to screen 2
	fireEvent.press(
		await waitFor( () => screen.getByText( /test-screen-1/ ) )
	);
	// Navigate to screen 3
	fireEvent.press(
		await waitFor( () => screen.getByText( /test-screen-2/ ) )
	);
	// Navigate to screen 2
	fireEvent.press(
		await waitFor( () => screen.getByText( /test-screen-3/ ) )
	);
	// Await navigation screen to allow async state updates to complete
	await waitFor( () => screen.getByText( /test-screen-2/ ) );

	expect( performLayoutAnimation ).toHaveBeenCalledTimes( 1 );
} );
