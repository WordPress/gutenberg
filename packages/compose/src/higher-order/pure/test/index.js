/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import pure from '../';

describe( 'pure', () => {
	it( 'functional component should rerender only when props change', () => {
		let i = 0;
		const MyComp = pure( () => {
			return <p data-testid="counter">{ ++i }</p>;
		} );
		const { rerender } = render( <MyComp /> );

		// Updating with same props doesn't rerender.
		rerender( <MyComp /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '1' );

		// New prop should trigger a rerender.
		rerender( <MyComp { ...{ prop: 'a' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '2' );

		// Keeping the same prop value should not rerender.
		rerender( <MyComp { ...{ prop: 'a' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '2' );

		// Changing the prop value should rerender.
		rerender( <MyComp { ...{ prop: 'b' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '3' );
	} );

	it( 'class component should rerender if the props or state change', async () => {
		const user = userEvent.setup();
		let i = 0;
		const MyComp = pure(
			class extends Component {
				constructor() {
					super( ...arguments );
					this.state = {
						val: '',
					};
				}
				render() {
					return (
						<>
							<p data-testid="counter">{ ++i }</p>
							<input
								type="text"
								value={ this.state.val }
								onChange={ ( e ) =>
									this.setState( { val: e.target.value } )
								}
							/>
							<input
								type="button"
								onClick={ () =>
									this.setState( { val: this.state.val } )
								}
							/>
						</>
					);
				}
			}
		);

		const { rerender } = render( <MyComp /> );

		// Updating with same props doesn't rerender.
		rerender( <MyComp /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '1' );

		// New prop should trigger a rerender.
		rerender( <MyComp { ...{ prop: 'a' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '2' );

		// Keeping the same prop value should not rerender.
		rerender( <MyComp { ...{ prop: 'a' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '2' );

		// Changing the prop value should rerender.
		rerender( <MyComp { ...{ prop: 'b' } } /> );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '3' );

		// New state value should trigger a rerender.
		await user.type( screen.getByRole( 'textbox' ), 'a' );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '4' );

		// Keeping the same state value should not trigger a rerender.
		await user.click( screen.getByRole( 'button' ) );
		expect( screen.getByTestId( 'counter' ) ).toHaveTextContent( '4' );
	} );
} );
