/**
 * WordPress dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { RouterProvider, useHistory, useLocation } from '../router';
function NavigationTestComponent() {
	const history = useHistory();
	const location = useLocation();
	return (
		<div>
			<div data-testid="current-path">{ location?.path ?? '' }</div>
			<button
				onClick={ () =>
					history.navigate( '/replaced-path', { replace: true } )
				}
			>
				Navigate with replace
			</button>
			<button onClick={ () => history.navigate( '/pushed-path' ) }>
				Navigate with push
			</button>
			<button
				onClick={ () =>
					history.navigate( '/replaced-with-state', {
						replace: true,
						state: { foo: 'bar' },
					} )
				}
			>
				Navigate with replace and state
			</button>
		</div>
	);
}

function renderWithRouter() {
	return render(
		<RouterProvider>
			<NavigationTestComponent />
		</RouterProvider>
	);
}

describe( 'useHistory', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'calls history.replaceState (not pushState) when replace: true is passed', () => {
		const replaceStateSpy = jest.spyOn( window.history, 'replaceState' );
		const pushStateSpy = jest.spyOn( window.history, 'pushState' );

		renderWithRouter();
		fireEvent.click( screen.getByText( 'Navigate with replace' ) );
		expect( replaceStateSpy ).toHaveBeenCalledTimes( 1 );
		expect( pushStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'defaults to history.pushState when the replace option is omitted', () => {
		const replaceStateSpy = jest.spyOn( window.history, 'replaceState' );
		const pushStateSpy = jest.spyOn( window.history, 'pushState' );

		renderWithRouter();
		fireEvent.click( screen.getByText( 'Navigate with push' ) );
		expect( pushStateSpy ).toHaveBeenCalledTimes( 1 );
		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not add a new history entry when replace: true is used', () => {
		renderWithRouter();

		const initialLength = window.history.length;
		fireEvent.click( screen.getByText( 'Navigate with replace' ) );
		expect( window.history.length ).toBe( initialLength );
	} );

	it( 'adds a new history entry when replace is not used', () => {
		renderWithRouter();

		const initialLength = window.history.length;
		fireEvent.click( screen.getByText( 'Navigate with push' ) );
		expect( window.history.length ).toBe( initialLength + 1 );
	} );

	it( 'passes state through correctly when using replace', () => {
		const replaceStateSpy = jest.spyOn( window.history, 'replaceState' );

		renderWithRouter();
		fireEvent.click(
			screen.getByText( 'Navigate with replace and state' )
		);
		const [ passedState ] = replaceStateSpy.mock.calls[ 0 ];
		expect( passedState.usr ).toMatchObject( { foo: 'bar' } );
	} );

	it( 'builds the same query string for replace as it would for push', () => {
		const replaceStateSpy = jest.spyOn( window.history, 'replaceState' );

		renderWithRouter();
		fireEvent.click( screen.getByText( 'Navigate with replace' ) );
		const [ , , url ] = replaceStateSpy.mock.calls[ 0 ];
		expect( url ).toEqual( expect.stringContaining( 'replaced-path' ) );
	} );
} );
