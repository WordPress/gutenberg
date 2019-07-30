/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import '../store';
import ifViewportMatches from '../if-viewport-matches';

describe( 'ifViewportMatches()', () => {
	const Component = () => <div>Hello</div>;

	it( 'should not render if query does not match', () => {
		dispatch( 'core/viewport' ).setIsMatching( { '> wide': false } );
		const EnhancedComponent = ifViewportMatches( '> wide' )( Component );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );

		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength( 0 );
	} );

	it( 'should render if query does match', () => {
		act( () => {
			dispatch( 'core/viewport' ).setIsMatching( { '> wide': true } );
		} );
		const EnhancedComponent = ifViewportMatches( '> wide' )( Component );
		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create( <EnhancedComponent /> );
		} );
		expect( testRenderer.root.findAllByType( Component ) ).toHaveLength( 1 );
	} );
} );
