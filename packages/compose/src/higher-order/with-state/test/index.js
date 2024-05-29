/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import withState from '../';

describe( 'withState', () => {
	it( 'should pass initial state and allow updates', async () => {
		const user = userEvent.setup();
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

		render( <EnhancedComponent /> );

		const button = screen.getByRole( 'button' );

		expect( console ).toHaveWarned();
		expect( button ).toHaveTextContent( '0' );

		await user.click( button );

		expect( button ).toHaveTextContent( '1' );
	} );
} );
