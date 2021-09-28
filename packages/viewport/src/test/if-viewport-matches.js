/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { useViewportMatch as useViewportMatchMock } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import '../store';
import ifViewportMatches from '../if-viewport-matches';

describe( 'ifViewportMatches()', () => {
	const Component = () => <div>Hello</div>;

	afterEach( () => {
		useViewportMatchMock.mockClear();
	} );

	it( 'should not render if query does not match', () => {
		useViewportMatchMock.mockReturnValueOnce( false );
		const EnhancedComponent = ifViewportMatches( '< wide' )( Component );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );

		expect( useViewportMatchMock.mock.calls ).toEqual( [
			[ 'wide', '<' ],
		] );

		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength(
			0
		);
	} );

	it( 'should render if query does match', () => {
		useViewportMatchMock.mockReturnValueOnce( true );
		const EnhancedComponent = ifViewportMatches( '>= wide' )( Component );
		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );

		expect( useViewportMatchMock.mock.calls ).toEqual( [
			[ 'wide', '>=' ],
		] );

		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength(
			1
		);
	} );
} );
