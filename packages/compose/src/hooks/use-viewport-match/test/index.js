/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import useViewportMatch from '../';

jest.mock( '../../use-media-query', () => {
	return jest.fn();
} );

import useMediaQueryMock from '../../use-media-query';

describe( 'useViewportMatch', () => {
	afterEach( () => {
		useMediaQueryMock.mockClear();
	} );

	const TestComponent = ( { breakpoint, operator } ) => {
		const result = useViewportMatch( breakpoint, operator );
		return `useViewportMatch: ${ result }`;
	};

	it( 'should return true when the viewport matches', async () => {
		let root;
		useMediaQueryMock.mockReturnValue( true );

		await act( async () => {
			root = create( <TestComponent breakpoint="wide" operator="<" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: true' );

		await act( async () => {
			root.update( <TestComponent breakpoint="medium" operator=">=" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: true' );

		await act( async () => {
			root.update( <TestComponent breakpoint="small" operator=">=" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: true' );

		expect( useMediaQueryMock.mock.calls ).toEqual( [
			[ '(max-width: 1280px)' ],
			[ '(min-width: 782px)' ],
			[ '(min-width: 600px)' ],
		] );

		root.unmount();
	} );

	it( 'should return false when the viewport matches', async () => {
		let root;
		useMediaQueryMock.mockReturnValue( false );

		await act( async () => {
			root = create( <TestComponent breakpoint="huge" operator=">=" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: false' );

		await act( async () => {
			root.update( <TestComponent breakpoint="large" operator="<" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: false' );

		await act( async () => {
			root.update( <TestComponent breakpoint="mobile" operator="<" /> );
		} );
		expect( root.toJSON() ).toBe( 'useViewportMatch: false' );

		expect( useMediaQueryMock.mock.calls ).toEqual( [
			[ '(min-width: 1440px)' ],
			[ '(max-width: 960px)' ],
			[ '(max-width: 480px)' ],
		] );

		root.unmount();
	} );
} );
