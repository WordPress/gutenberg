/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { NavigatorProvider, NavigatorScreen, useNavigator } from '../';

jest.mock( 'framer-motion', () => {
	const actual = jest.requireActual( 'framer-motion' );
	return {
		__esModule: true,
		...actual,
		AnimatePresence: ( { children } ) => <div>{ children }</div>,
		motion: {
			...actual.motion,
			div: require( 'react' ).forwardRef( ( { children }, ref ) => (
				<div ref={ ref }>{ children }</div>
			) ),
		},
	};
} );

const PATHS = {
	HOME: '/',
	CHILD: '/child',
	NOT_FOUND: '/not-found',
};

function NavigatorButton( { path, isBack = false, onClick, ...props } ) {
	const navigator = useNavigator();
	return (
		<button
			onClick={ () => {
				navigator.push( path, { isBack } );
				// Used to spy on the values passed to `navigator.push`
				onClick?.( { path, isBack } );
			} }
			{ ...props }
		/>
	);
}

const MyNavigation = ( {
	initialPath = PATHS.HOME,
	onNavigatorButtonClick,
} ) => (
	<NavigatorProvider initialPath={ initialPath }>
		<NavigatorScreen path={ PATHS.HOME }>
			<p>This is the home screen.</p>
			<NavigatorButton
				path={ PATHS.CHILD }
				onClick={ onNavigatorButtonClick }
			>
				Navigate to child screen.
			</NavigatorButton>
			<NavigatorButton
				path={ PATHS.NOT_FOUND }
				onClick={ onNavigatorButtonClick }
			>
				Navigate to non-existing screen.
			</NavigatorButton>
		</NavigatorScreen>

		<NavigatorScreen path={ PATHS.CHILD }>
			<p>This is the child screen.</p>
			<NavigatorButton
				path={ PATHS.HOME }
				isBack
				onClick={ onNavigatorButtonClick }
			>
				Go back
			</NavigatorButton>
		</NavigatorScreen>

		{ /* A `NavigatorScreen` with `path={ PATHS.NOT_FOUND }` is purposefully not included */ }
	</NavigatorProvider>
);

const getNavigationScreenByText = ( text, { throwIfNotFound = true } = {} ) => {
	const fnName = throwIfNotFound ? 'getByText' : 'queryByText';
	return screen[ fnName ]( text );
};
const getHomeScreen = ( { throwIfNotFound } = {} ) =>
	getNavigationScreenByText( 'This is the home screen.', {
		throwIfNotFound,
	} );
const getChildScreen = ( { throwIfNotFound } = {} ) =>
	getNavigationScreenByText( 'This is the child screen.', {
		throwIfNotFound,
	} );

const getNavigationButtonByText = ( text, { throwIfNotFound = true } = {} ) => {
	const fnName = throwIfNotFound ? 'getByRole' : 'queryByRole';
	return screen[ fnName ]( 'button', { name: text } );
};
const getToNonExistingScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Navigate to non-existing screen.', {
		throwIfNotFound,
	} );
const getToChildScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Navigate to child screen.', {
		throwIfNotFound,
	} );
const getToHomeScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Go back', {
		throwIfNotFound,
	} );

describe( 'Navigator', () => {
	it( 'should render', () => {
		render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should show a different screen on the first render depending on the value of `initialPath`', () => {
		render( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getChildScreen() ).toBeInTheDocument();
	} );

	it( 'should ignore changes to `initialPath` after the first render', () => {
		const { rerender } = render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();

		rerender( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should not rended anything if the `initialPath` does not match any available screen', () => {
		render( <MyNavigation initialPath={ PATHS.NOT_FOUND } /> );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should navigate across screens', () => {
		const spy = jest.fn();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Navigate to child screen
		fireEvent.click( getToChildScreenButton() );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getChildScreen() ).toBeInTheDocument();
		expect( getToHomeScreenButton() ).toBeInTheDocument();

		// Navigate back to home screen
		fireEvent.click( getToHomeScreenButton() );

		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getHomeScreen() ).toBeInTheDocument();

		// Check the values passed to `navigator.push()`
		expect( spy ).toHaveBeenCalledTimes( 2 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.CHILD,
			isBack: false,
		} );
		expect( spy ).toHaveBeenNthCalledWith( 2, {
			path: PATHS.HOME,
			isBack: true,
		} );
	} );

	it( 'should not rended anything if the path does not match any available screen', () => {
		const spy = jest.fn();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Attempt to navigate to non-existing screen. No screens get rendered.
		fireEvent.click( getToNonExistingScreenButton() );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();

		// Check the values passed to `navigator.push()`
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.NOT_FOUND,
			isBack: false,
		} );
	} );
} );
