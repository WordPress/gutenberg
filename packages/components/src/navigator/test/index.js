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
	NESTED: '/child/nested',
	NOT_FOUND: '/not-found',
};

function NavigatorButton( { path, onClick, ...props } ) {
	const { push } = useNavigator();
	return (
		<button
			onClick={ () => {
				push( path );
				// Used to spy on the values passed to `navigator.push`
				onClick?.( { type: 'push', path } );
			} }
			{ ...props }
		/>
	);
}

function NavigatorBackButton( { onClick, ...props } ) {
	const { pop } = useNavigator();
	return (
		<button
			onClick={ () => {
				pop();
				// Used to spy on the values passed to `navigator.push`
				onClick?.( { type: 'pop' } );
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
				path={ PATHS.NESTED }
				onClick={ onNavigatorButtonClick }
			>
				Navigate to nested screen.
			</NavigatorButton>
			<NavigatorBackButton onClick={ onNavigatorButtonClick }>
				Go back
			</NavigatorBackButton>
		</NavigatorScreen>

		<NavigatorScreen path={ PATHS.NESTED }>
			<p>This is the nested screen.</p>
			<NavigatorBackButton onClick={ onNavigatorButtonClick }>
				Go back
			</NavigatorBackButton>
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
const getNestedScreen = ( { throwIfNotFound } = {} ) =>
	getNavigationScreenByText( 'This is the nested screen.', {
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
const getToNestedScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Navigate to nested screen.', {
		throwIfNotFound,
	} );
const getBackButton = ( { throwIfNotFound } = {} ) =>
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
		expect(
			getNestedScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should show a different screen on the first render depending on the value of `initialPath`', () => {
		render( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getChildScreen() ).toBeInTheDocument();
		expect(
			getNestedScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should ignore changes to `initialPath` after the first render', () => {
		const { rerender } = render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getNestedScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();

		rerender( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getNestedScreen( { throwIfNotFound: false } )
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
		expect(
			getNestedScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should navigate across screens', () => {
		const spy = jest.fn();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Navigate to child screen
		fireEvent.click( getToChildScreenButton() );

		expect( getChildScreen() ).toBeInTheDocument();
		expect( getBackButton() ).toBeInTheDocument();

		// Navigate back to home screen
		fireEvent.click( getBackButton() );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Navigate again to child screen
		fireEvent.click( getToChildScreenButton() );

		expect( getChildScreen() ).toBeInTheDocument();
		expect( getToNestedScreenButton() ).toBeInTheDocument();

		// Navigate to nested screen
		fireEvent.click( getToNestedScreenButton() );

		expect( getNestedScreen() ).toBeInTheDocument();
		expect( getBackButton() ).toBeInTheDocument();

		// Navigate back to child screen
		fireEvent.click( getBackButton() );

		expect( getChildScreen() ).toBeInTheDocument();
		expect( getToNestedScreenButton() ).toBeInTheDocument();

		// Navigate back to home screen
		fireEvent.click( getBackButton() );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Check the values passed to `navigator.push()`
		expect( spy ).toHaveBeenCalledTimes( 6 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.CHILD,
			type: 'push',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 2, {
			type: 'pop',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 3, {
			path: PATHS.CHILD,
			type: 'push',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 4, {
			path: PATHS.NESTED,
			type: 'push',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 5, {
			type: 'pop',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 6, {
			type: 'pop',
		} );
	} );

	it( 'should not rended anything if the path does not match any available screen', () => {
		const spy = jest.fn();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect( getToNonExistingScreenButton() ).toBeInTheDocument();

		// Attempt to navigate to non-existing screen. No screens get rendered.
		fireEvent.click( getToNonExistingScreenButton() );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect(
			getNestedScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();

		// Check the values passed to `navigator.push()`
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.NOT_FOUND,
			type: 'push',
		} );
	} );
} );
