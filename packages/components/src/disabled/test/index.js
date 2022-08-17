/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */

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
				find( context, ...rest ) {
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

					return focus.focusable.find( context, ...rest );
				},
			},
		},
	};
} );

describe( 'Disabled', () => {
	const Form = () => (
		<form>
			<input />
			<div contentEditable tabIndex={ 0 } />
		</form>
	);

	it( 'will disable all fields', () => {
		const { container } = render(
			<Disabled>
				<Form />
			</Disabled>
		);

		const input = container.querySelector( 'form input' );
		const div = container.querySelector( 'form div' );
		expect( input ).toBeDisabled();
		expect( div ).toHaveAttribute( 'contenteditable', 'false' );
		expect( div ).not.toHaveAttribute( 'tabindex' );
		expect( div ).not.toHaveAttribute( 'disabled' );
	} );

	it( 'should cleanly un-disable via reconciliation', () => {
		const MaybeDisable = ( { isDisabled } ) =>
			isDisabled ? (
				<Disabled>
					<Form />
				</Disabled>
			) : (
				<Form />
			);

		const { container, rerender } = render( <MaybeDisable /> );
		rerender( <MaybeDisable isDisabled={ false } /> );

		const input = container.querySelector( 'form input' );
		const div = container.querySelector( 'form div' );

		expect( input ).not.toBeDisabled();
		expect( div ).toHaveAttribute( 'contenteditable', 'true' );
		expect( div ).toHaveAttribute( 'tabindex' );
	} );

	it( 'will disable or enable descendant fields based on the isDisabled prop value', () => {
		const MaybeDisable = ( { isDisabled = true } ) => (
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
		);

		const { container, rerender } = render( <MaybeDisable /> );

		const input = container.querySelector( 'form input' );
		const div = container.querySelector( 'form div' );

		expect( input ).toBeDisabled();
		expect( div ).toHaveAttribute( 'contenteditable', 'false' );

		rerender( <MaybeDisable isDisabled={ false } /> );

		expect( input ).not.toBeDisabled();
		expect( div ).toHaveAttribute( 'contenteditable', 'true' );
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
