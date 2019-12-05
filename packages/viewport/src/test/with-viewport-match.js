/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import '../store';
import withViewportMatch from '../with-viewport-match';

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch( breakPoint, operator ) {
			if ( breakPoint === 'wide' && operator === '>=' ) {
				return false;
			}
			if ( breakPoint === 'small' && operator === '>=' ) {
				return true;
			}
			if ( breakPoint === 'large' && operator === '>=' ) {
				return true;
			}
			if ( breakPoint === 'small' && operator === '<' ) {
				return false;
			}
		},
	};
} );

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
		const EnhancedComponent = withViewportMatch( {
			isWide: '>= wide',
			isSmall: '>= small',
			isLarge: 'large',
			isLessThanSmall: '< small',
		}
		)( ChildComponent );
		const wrapper = renderer.create( getTestComponent( EnhancedComponent ) );

		const { props } = wrapper.root.findByType( ChildComponent );
		expect( props.isWide ).toBe( false );
		expect( props.isSmall ).toBe( true );
		expect( props.isLarge ).toBe( true );
		expect( props.isLessThanSmall ).toBe( false );

		wrapper.unmount();
	} );
} );
