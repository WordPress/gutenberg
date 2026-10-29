import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from '@wordpress/element';
import withState from '../';
import type { WithStateInnerProps } from '../types';

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

	it( 'should pass own props to the updater', async () => {
		const user = userEvent.setup();
		type OwnProps = { step: number };
		type State = { count: number };
		const EnhancedComponent = withState< State >( { count: 0 } )(
			( {
				count,
				setState,
			}: OwnProps & WithStateInnerProps< State, OwnProps > ) => (
				<button
					onClick={ () =>
						setState( ( state, props ) => ( {
							count: state.count + props.step,
						} ) )
					}
				>
					{ count }
				</button>
			)
		);

		render( <EnhancedComponent step={ 2 } /> );

		const button = screen.getByRole( 'button' );

		expect( console ).toHaveWarned();

		await user.click( button );

		expect( button ).toHaveTextContent( '2' );
	} );

	it( 'should keep defaulted own props optional', () => {
		type State = { count: number };
		class Counter extends Component<
			{ label: string } & WithStateInnerProps< State >
		> {
			static defaultProps = { label: 'Count' };

			render() {
				return (
					<p>
						{ this.props.label }: { this.props.count }
					</p>
				);
			}
		}
		const EnhancedComponent = withState< State >( { count: 0 } )( Counter );

		render( <EnhancedComponent /> );

		expect( console ).toHaveWarned();
		expect( screen.getByText( 'Count: 0' ) ).toBeVisible();
	} );

	it( 'should require an initial state for required state keys', () => {
		// Only type checked: calling it would log another deprecation.
		const check = () => {
			// @ts-expect-error `count` would be undefined at runtime.
			withState< { count: number } >();
			withState< { count?: number } >();
			withState();
		};

		expect( check ).toBeInstanceOf( Function );
	} );
} );
