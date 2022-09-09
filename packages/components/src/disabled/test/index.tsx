/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Disabled from '../';
import userEvent from '@testing-library/user-event';

jest.mock( '@wordpress/dom', () => {
	const focus = jest.requireActual( '../../../../dom/src' ).focus;
	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context: Element, options = { sequential: false } ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					Array.from( context.querySelectorAll( '*' ) ).forEach(
						( element ) => {
							Object.defineProperties( element, {
								offsetWidth: {
									get: () => 1,
									configurable: true,
								},
							} );
						}
					);

					return focus.focusable.find( context, options );
				},
			},
		},
	};
} );

describe( 'Disabled', () => {
	const Form = () => (
		<form title="form">
			<input />
			<div title="edit my content" contentEditable tabIndex={ 0 } />
		</form>
	);

	it( 'will disable all fields', () => {
		render(
			<Disabled>
				<Form />
			</Disabled>
		);

		const input = screen.getByRole( 'textbox' );
		const contentEditable = screen.getByTitle( 'edit my content' );
		expect( input ).toBeDisabled();
		expect( contentEditable ).toHaveAttribute( 'contenteditable', 'false' );
		expect( contentEditable ).not.toHaveAttribute( 'tabindex' );
		expect( contentEditable ).not.toHaveAttribute( 'disabled' );
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

		const { rerender } = render( <MaybeDisable /> );

		const input = screen.getByRole( 'textbox' );
		const contentEditable = screen.getByTitle( 'edit my content' );

		expect( input ).toBeDisabled();
		expect( contentEditable ).toHaveAttribute( 'contenteditable', 'false' );

		rerender( <MaybeDisable isDisabled={ false } /> );

		expect( input ).not.toBeDisabled();
		expect( contentEditable ).toHaveAttribute( 'contenteditable', 'true' );
		expect( contentEditable ).toHaveAttribute( 'tabindex' );
	} );

	it( 'will disable or enable descendant fields based on the isDisabled prop value', () => {
		const MaybeDisable = ( { isDisabled = true } ) => (
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
		);

		const { rerender } = render( <MaybeDisable /> );

		const input = screen.getByRole( 'textbox' );
		const contentEditable = screen.getByTitle( 'edit my content' );

		expect( input ).toBeDisabled();
		expect( contentEditable ).toHaveAttribute( 'contenteditable', 'false' );

		rerender( <MaybeDisable isDisabled={ false } /> );

		expect( input ).not.toBeDisabled();
		expect( contentEditable ).toHaveAttribute( 'contenteditable', 'true' );
	} );

	it( 'will disable all fields on sneaky DOM manipulation', async () => {
		render(
			<Disabled>
				<Form />
			</Disabled>
		);

		const form = screen.getByTitle( 'form' );
		form.insertAdjacentHTML(
			'beforeend',
			'<input title="sneaky input" />'
		);
		form.insertAdjacentHTML(
			'beforeend',
			'<div title="sneaky editable content" contentEditable tabIndex={ 0 } />'
		);
		const sneakyInput = screen.getByTitle( 'sneaky input' );
		const sneakyEditable = screen.getByTitle( 'sneaky editable content' );

		await waitFor( () => expect( sneakyInput ).toBeDisabled() );
		await waitFor( () =>
			expect( sneakyEditable ).toHaveAttribute(
				'contenteditable',
				'false'
			)
		);
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
