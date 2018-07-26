/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import '../store';
import withViewportMatch from '../with-viewport-match';

describe( 'withViewportMatch()', () => {
	const ChildComponent = () => <div>Hello</div>;

	// this is needed because TestUtils does not accept a stateless component.
	// anything run through a HOC ends up as a stateless component.
	const getTestComponent = ( WrappedComponent ) => {
		class TestComponent extends Component {
			render() {
				return <WrappedComponent { ...this.props } />;
			}
		}
		return <TestComponent />;
	};

	it( 'should render with result of query as custom prop name', () => {
		dispatch( 'core/viewport' ).setIsMatching( { '> wide': true } );
		const EnhancedComponent = withViewportMatch(
			{ isWide: '> wide' }
		)( ChildComponent );
		const wrapper = renderer.create( getTestComponent( EnhancedComponent ) );

		expect( wrapper.root.findByType( ChildComponent ).props.isWide )
			.toBe( true );

		wrapper.unmount();
	} );
} );
