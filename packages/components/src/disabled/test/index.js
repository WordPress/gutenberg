/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

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
				find( context ) {
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

					return focus.focusable.find( ...arguments );
				},
			},
		},
	};
} );

describe( 'Disabled', () => {
	let MutationObserver;

	beforeAll( () => {
		MutationObserver = window.MutationObserver;
		window.MutationObserver = function () {};
		window.MutationObserver.prototype = {
			observe() {},
			disconnect() {},
		};
	} );

	afterAll( () => {
		window.MutationObserver = MutationObserver;
	} );

	const Form = () => (
		<form>
			<input />
			<div contentEditable tabIndex="0" />
		</form>
	);

	it( 'will disable all fields', () => {
		let container;
		act( () => {
			container = render(
				<Disabled>
					<Form />
				</Disabled>
			).container;
		} );
		const input = container.querySelector( 'input' );
		const div = container.querySelectorAll( 'div' )[ 1 ];

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		expect( div.hasAttribute( 'tabindex' ) ).toBe( false );
		expect( div.hasAttribute( 'disabled' ) ).toBe( false );
	} );

	it( 'will disable or enable descendant fields based on the isDisabled prop value', () => {
		function MaybeDisable( props ) {
			return (
				<Disabled { ...props }>
					<Form />
				</Disabled>
			);
		}

		let container;
		let rerender;
		act( () => {
			( { container, rerender } = render(
				<MaybeDisable isDisabled={ true } />
			) );
		} );

		const input = container.querySelector( 'input' );
		const div = container.querySelectorAll( 'div' )[ 1 ];

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		rerender( <MaybeDisable isDisabled={ false } /> );

		const input2 = container.querySelector( 'input' );
		const div2 = container.querySelector( 'div' );

		expect( input2.hasAttribute( 'disabled' ) ).toBe( false );
		expect( div2.getAttribute( 'contenteditable' ) ).not.toBe( 'false' );
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
			let container;
			act( () => {
				container = render(
					<Disabled>
						<DisabledStatus />
					</Disabled>
				).container;
			} );
			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement.textContent ).toBe( 'Disabled' );
		} );

		test( "lets components know that they're not disabled via context when isDisabled is false", () => {
			let container;
			act( () => {
				container = render(
					<Disabled isDisabled={ false }>
						<DisabledStatus />
					</Disabled>
				).container;
			} );
			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement.textContent ).toBe( 'Not disabled' );
		} );

		test( "lets components know that they're not disabled via context", () => {
			let container;
			act( () => {
				container = render( <DisabledStatus /> ).container;
			} );
			const wrapperElement = container.querySelector( 'p' );
			expect( wrapperElement.textContent ).toBe( 'Not disabled' );
		} );
	} );
} );
