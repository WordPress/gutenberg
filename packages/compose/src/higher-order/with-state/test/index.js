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
import { createRoot } from '@wordpress/element';

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

		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <EnhancedComponent /> );
		jest.runAllTimers();
		const buttonElement = () => container.querySelector( 'button' );

		expect( console ).toHaveWarned();
		expect( buttonElement().outerHTML ).toBe( '<button>0</button>' );
		TestUtils.Simulate.click( buttonElement() );
		jest.runAllTimers();
		expect( buttonElement().outerHTML ).toBe( '<button>1</button>' );
	} );
} );
