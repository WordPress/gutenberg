/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Disabled from '../';

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
		<form>
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

	// Ideally, we'd have two more test cases here:
	//
	//  - it( 'will disable all fields on component render change' )
	//  - it( 'will disable all fields on sneaky DOM manipulation' )
	//
	// Alas, JSDOM does not support MutationObserver:
	//
	//  https://github.com/jsdom/jsdom/issues/639

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
			const { container } = render(
				<Disabled>
					<DisabledStatus />
				</Disabled>
			);

			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement ).toHaveTextContent( 'Disabled' );
		} );

		test( "lets components know that they're not disabled via context when isDisabled is false", () => {
			const { container } = render(
				<Disabled isDisabled={ false }>
					<DisabledStatus />
				</Disabled>
			);
			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement ).toHaveTextContent( 'Not disabled' );
		} );

		test( "lets components know that they're not disabled via context", () => {
			const { container } = render( <DisabledStatus /> );
			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement ).toHaveTextContent( 'Not disabled' );
		} );
	} );
} );
