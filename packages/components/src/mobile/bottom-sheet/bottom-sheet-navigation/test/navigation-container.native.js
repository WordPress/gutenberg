/**
 * External dependencies
 */
import { Text } from 'react-native';
import { act, render, fireEvent, withReanimatedTimer } from 'test/helpers';
import { useNavigation } from '@react-navigation/native';

/**
 * Internal dependencies
 */
import NavigationContainer from '../navigation-container';
import NavigationScreen from '../navigation-screen';

const WINDOW_HEIGHT = 1000;

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

const fireLayoutEvent = ( element, layout ) =>
	fireEvent( element, 'layout', {
		nativeEvent: { layout },
	} );

beforeAll( () => {
	jest.spyOn(
		require( 'react-native' ),
		'useWindowDimensions'
	).mockReturnValue( { width: 900, height: WINDOW_HEIGHT } );
} );

it( 'animates height transitioning from non-full-screen to non-full-screen', async () =>
	withReanimatedTimer( async () => {
		const screen = render(
			<NavigationContainer testID="navigation-container" main animate>
				<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
				<TestScreen name="test-screen-2" navigateTo="test-screen-1" />
			</NavigationContainer>
		);

		const navigationContainer = await screen.findByTestId(
			'navigation-container'
		);

		expect( navigationContainer ).toHaveAnimatedStyle( { height: 1 } );

		// First height value should be set without animation, but we need
		// to wait for a frame to let animated styles be updated.
		const screen1Layout = { height: 100 };
		fireLayoutEvent(
			screen.getByTestId( 'navigation-screen-test-screen-1' ),
			screen1Layout
		);
		act( () => jest.advanceTimersByTime( 1 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( screen1Layout );

		// Navigate to screen 2
		fireEvent.press( screen.getByText( /test-screen-1/ ) );
		const screen2Layout = { height: 200 };
		fireLayoutEvent(
			screen.getByTestId( 'navigation-screen-test-screen-2' ),
			screen2Layout
		);
		// The animation takes 300 ms, so we wait that time plus 1 ms
		// to the completion.
		act( () => jest.advanceTimersByTime( 301 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( screen2Layout );
	} ) );

it( 'animates height transitioning from non-full-screen to full-screen', async () =>
	withReanimatedTimer( async () => {
		const screen = render(
			<NavigationContainer testID="navigation-container" main animate>
				<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
				<TestScreen
					name="test-screen-2"
					navigateTo="test-screen-1"
					fullScreen
				/>
			</NavigationContainer>
		);

		const navigationContainer = await screen.findByTestId(
			'navigation-container'
		);

		expect( navigationContainer ).toHaveAnimatedStyle( { height: 1 } );

		// First height value should be set without animation, but we need
		// to wait for a frame to let animated styles be updated.
		const screen1Layout = { height: 100 };
		fireLayoutEvent(
			screen.getByTestId( 'navigation-screen-test-screen-1' ),
			screen1Layout
		);
		act( () => jest.advanceTimersByTime( 1 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( screen1Layout );

		// Navigate to screen 2
		fireEvent.press( screen.getByText( /test-screen-1/ ) );
		// The animation takes 300 ms, so we wait that time plus 1 ms
		// to the completion.
		act( () => jest.advanceTimersByTime( 301 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( {
			height: WINDOW_HEIGHT,
		} );
	} ) );

it( 'animates height transitioning from full-screen to non-full-screen', async () =>
	withReanimatedTimer( async () => {
		const screen = render(
			<NavigationContainer testID="navigation-container" main animate>
				<TestScreen name="test-screen-1" navigateTo="test-screen-2" />
				<TestScreen
					name="test-screen-2"
					navigateTo="test-screen-1"
					fullScreen
				/>
			</NavigationContainer>
		);

		const navigationContainer = await screen.findByTestId(
			'navigation-container'
		);

		expect( navigationContainer ).toHaveAnimatedStyle( { height: 1 } );

		// First height value should be set without animation, but we need
		// to wait for a frame to let animated styles be updated.
		const screen1Layout = { height: 100 };
		fireLayoutEvent(
			screen.getByTestId( 'navigation-screen-test-screen-1' ),
			screen1Layout
		);
		act( () => jest.advanceTimersByTime( 1 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( screen1Layout );

		// Navigate to screen 2
		fireEvent.press( screen.getByText( /test-screen-1/ ) );
		// The animation takes 300 ms, so we wait that time plus 1 ms
		// to the completion.
		act( () => jest.advanceTimersByTime( 301 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( {
			height: WINDOW_HEIGHT,
		} );

		// Navigate to screen 1
		fireEvent.press( await screen.findByText( /test-screen-2/ ) );
		// The animation takes 300 ms, so we wait that time plus 1 ms
		// to the completion.
		act( () => jest.advanceTimersByTime( 301 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( screen1Layout );
	} ) );

it( 'does not animate height transitioning from full-screen to full-screen', async () =>
	withReanimatedTimer( async () => {
		const screen = render(
			<NavigationContainer testID="navigation-container" main animate>
				<TestScreen
					name="test-screen-1"
					navigateTo="test-screen-2"
					fullScreen
				/>
				<TestScreen
					name="test-screen-2"
					navigateTo="test-screen-1"
					fullScreen
				/>
			</NavigationContainer>
		);

		const navigationContainer = await screen.findByTestId(
			'navigation-container'
		);

		// First height value should be set without animation, but we need
		// to wait for a frame to let animated styles be updated.
		act( () => jest.advanceTimersByTime( 1 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( {
			height: WINDOW_HEIGHT,
		} );

		// Navigate to screen 2
		fireEvent.press( screen.getByText( /test-screen-1/ ) );
		// We wait some milliseconds to check if height has changed.
		act( () => jest.advanceTimersByTime( 10 ) );
		expect( navigationContainer ).toHaveAnimatedStyle( {
			height: WINDOW_HEIGHT,
		} );
	} ) );
