/**
 * External dependencies
 */
import { render } from '@testing-library/react';

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
		useMediaQueryMock.mockReturnValue( true );

		const { container, rerender } = render(
			<TestComponent breakpoint="wide" operator="<" />
		);

		expect( container ).toHaveTextContent( 'useViewportMatch: true' );

		rerender( <TestComponent breakpoint="medium" operator=">=" /> );

		expect( container ).toHaveTextContent( 'useViewportMatch: true' );

		rerender( <TestComponent breakpoint="small" operator=">=" /> );

		expect( container ).toHaveTextContent( 'useViewportMatch: true' );

		expect( useMediaQueryMock ).toHaveBeenCalledTimes( 3 );
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			1,
			'(max-width: 1280px)'
		);
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			2,
			'(min-width: 782px)'
		);
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			3,
			'(min-width: 600px)'
		);
	} );

	it( 'should return false when the viewport matches', async () => {
		useMediaQueryMock.mockReturnValue( false );

		const { container, rerender } = render(
			<TestComponent breakpoint="huge" operator=">=" />
		);

		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		rerender( <TestComponent breakpoint="large" operator="<" /> );

		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		rerender( <TestComponent breakpoint="mobile" operator="<" /> );

		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		expect( useMediaQueryMock ).toHaveBeenCalledTimes( 3 );
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			1,
			'(min-width: 1440px)'
		);
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			2,
			'(max-width: 960px)'
		);
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith(
			3,
			'(max-width: 480px)'
		);
	} );

	it( 'should correctly simulate a value', async () => {
		useMediaQueryMock.mockReturnValue( true );

		const innerElement = <TestComponent breakpoint="wide" operator=">=" />;
		const WidthProvider = useViewportMatch.__experimentalWidthProvider;

		const { container, rerender } = render(
			<WidthProvider value={ 300 }>{ innerElement }</WidthProvider>
		);
		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		rerender(
			<WidthProvider value={ 1200 }>{ innerElement }</WidthProvider>
		);

		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		rerender(
			<WidthProvider value={ 1300 }>{ innerElement }</WidthProvider>
		);

		expect( container ).toHaveTextContent( 'useViewportMatch: true' );

		rerender(
			<WidthProvider value={ 1300 }>
				<TestComponent breakpoint="wide" operator="<" />
			</WidthProvider>
		);

		expect( container ).toHaveTextContent( 'useViewportMatch: false' );

		expect( useMediaQueryMock ).toHaveBeenCalledTimes( 4 );
		// `useMediaQuery` is expected to receive `undefined` when simulating width.
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith( 1, undefined );
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith( 2, undefined );
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith( 3, undefined );
		expect( useMediaQueryMock ).toHaveBeenNthCalledWith( 4, undefined );
	} );
} );
