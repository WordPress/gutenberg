/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import withState from '../';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

// This is needed because TestUtils does not accept a stateless component.
// anything run through a HOC ends up as a stateless component.
const getTestComponent = ( WrappedComponent ) => {
	class TestComponent extends Component {
		render() {
			return <WrappedComponent { ...this.props } />;
		}
	}
	return <TestComponent />;
};

describe( 'withState', () => {
	it( 'should pass initial state and allow updates', () => {
		const EnhancedComponent = withState( {
			count: 0,
		} )( ( { count, setState } ) => (
			<button
				onClick={ () =>
					setState( ( state ) => ( { count: state.count + 1 } ) )
				}
			>
				{ count }
			</button>
		) );

		const wrapper = TestUtils.renderIntoDocument(
			getTestComponent( EnhancedComponent )
		);

		const buttonElement = () =>
			TestUtils.findRenderedDOMComponentWithTag( wrapper, 'button' );

		expect( console ).toHaveWarned();
		expect( buttonElement().outerHTML ).toBe( '<button>0</button>' );
		TestUtils.Simulate.click( buttonElement() );
		expect( buttonElement().outerHTML ).toBe( '<button>1</button>' );
	} );
} );
