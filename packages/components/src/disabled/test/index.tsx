/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Disabled from '../';
import userEvent from '@testing-library/user-event';

describe( 'Disabled', () => {
	const Form = () => (
		<form title="form">
			<input />
			<div title="edit my content" contentEditable tabIndex={ 0 } />
		</form>
	);

	it( 'will disable all fields', () => {
		const { container } = render(
			<Disabled>
				<Form />
			</Disabled>
		);

		expect( container.firstChild ).toHaveAttribute( 'inert' );
	} );

	it( 'should cleanly un-disable via reconciliation', () => {
		const MaybeDisable = ( { isDisabled = true } ) =>
			isDisabled ? (
				<Disabled>
					<Form />
				</Disabled>
			) : (
				<Form />
			);

		const { container, rerender } = render( <MaybeDisable /> );

		expect( container.firstChild ).toHaveAttribute( 'inert' );

		rerender( <MaybeDisable isDisabled={ false } /> );

		expect( container.firstChild ).not.toHaveAttribute( 'inert' );
	} );

	it( 'will disable or enable descendant fields based on the isDisabled prop value', () => {
		const MaybeDisable = ( { isDisabled = true } ) => (
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
		);

		const { rerender, container } = render( <MaybeDisable /> );

		expect( container.firstChild ).toHaveAttribute( 'inert' );

		rerender( <MaybeDisable isDisabled={ false } /> );

		expect( container.firstChild ).not.toHaveAttribute( 'inert' );
	} );

	it( 'should preserve input values when toggling the isDisabled prop', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		const MaybeDisable = ( { isDisabled = true } ) => (
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
		);

		const getInput = () => screen.getByRole( 'textbox' );
		const getContentEditable = () => screen.getByTitle( 'edit my content' );

		const { rerender } = render( <MaybeDisable isDisabled={ false } /> );

		await user.type( getInput(), 'This is input.' );
		expect( getInput() ).toHaveValue( 'This is input.' );

		await user.type( getContentEditable(), 'This is contentEditable.' );
		expect( getContentEditable() ).toHaveTextContent(
			'This is contentEditable.'
		);

		rerender( <MaybeDisable isDisabled={ true } /> );
		expect( getInput() ).toHaveValue( 'This is input.' );
		expect( getContentEditable() ).toHaveTextContent(
			'This is contentEditable.'
		);

		rerender( <MaybeDisable isDisabled={ false } /> );
		expect( getInput() ).toHaveValue( 'This is input.' );
		expect( getContentEditable() ).toHaveTextContent(
			'This is contentEditable.'
		);
	} );

	describe( 'Consumer', () => {
		function DisabledStatus() {
			return (
				<p>
					<Disabled.Consumer>
						{ ( isDisabled ) =>
							isDisabled ? 'Disabled' : 'Not disabled'
						}
					</Disabled.Consumer>
				</p>
			);
		}

		test( "lets components know that they're disabled via context", () => {
			render(
				<Disabled>
					<DisabledStatus />
				</Disabled>
			);

			expect( screen.getByText( 'Disabled' ) ).toBeInTheDocument();
		} );

		test( "lets components know that they're not disabled via context when isDisabled is false", () => {
			render(
				<Disabled isDisabled={ false }>
					<DisabledStatus />
				</Disabled>
			);
			expect( screen.getByText( 'Not disabled' ) ).toBeInTheDocument();
		} );

		test( "lets components know that they're not disabled via context when the Disabled component is not rendered at all", () => {
			render( <DisabledStatus /> );
			expect( screen.getByText( 'Not disabled' ) ).toBeInTheDocument();
		} );
	} );
} );
