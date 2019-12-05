/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import '../store';
import ifViewportMatches from '../if-viewport-matches';

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch( breakPoint, operator ) {
			if ( breakPoint === 'wide' && operator === '>=' ) {
				return true;
			}
			if ( breakPoint === 'wide' && operator === '<' ) {
				return false;
			}
		},
	};
} );

describe( 'ifViewportMatches()', () => {
	const Component = () => <div>Hello</div>;

	it( 'should not render if query does not match', () => {
		const EnhancedComponent = ifViewportMatches( '< wide' )( Component );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );

		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength( 0 );
	} );

	it( 'should render if query does match', () => {
		const EnhancedComponent = ifViewportMatches( '>= wide' )( Component );
		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );
		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength( 1 );
	} );
} );
