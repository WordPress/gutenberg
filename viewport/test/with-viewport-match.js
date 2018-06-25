/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import '../store';
import withViewportMatch from '../with-viewport-match';

describe( 'withViewportMatch()', () => {
	const Component = ( props ) => <div>{ props.isWide ? 'true' : 'false' }</div>;

	it( 'should render with result of query as custom prop name', () => {
		dispatch( 'core/viewport' ).setIsMatching( { '> wide': true } );
		const EnhancedComponent = withViewportMatch( { isWide: '> wide' } )( Component );
		const testRenderer = TestRenderer.create( <EnhancedComponent /> );

		expect( testRenderer.root.findByType( 'div' ).props.children ).toBe( 'true' );
	} );
} );
