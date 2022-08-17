/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { Component, useState, useEffect } from '@wordpress/element';

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
			<div contentEditable tabIndex={ 0 } />
		</form>
	);

	// This is needed because TestUtils does not accept a stateless component.
	class DisabledComponent extends Component {
		render() {
			const { children, isDisabled } = this.props;

			return <Disabled isDisabled={ isDisabled }>{ children }</Disabled>;
		}
	}

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
		const MaybeDisable = () => {
			const [ isDisabled, setDisabled ] = useState( true );

			useEffect( () => {
				setDisabled( false );
			}, [] );

			return isDisabled ? (
				<Disabled>
					<Form />
				</Disabled>
			) : (
				<Form />
			);
		};

		const { container } = render( <MaybeDisable /> );

		const input = container.querySelector( 'form input' );
		const div = container.querySelector( 'form div' );

		expect( input ).not.toBeDisabled();
		expect( div ).toHaveAttribute( 'contenteditable', 'true' );
		expect( div ).toHaveAttribute( 'tabindex' );
	} );

	it( 'will disable or enable descendant fields based on the isDisabled prop value', () => {
		class MaybeDisable extends Component {
			constructor() {
				super( ...arguments );
				this.state = { isDisabled: true };
			}

			render() {
				return (
					<DisabledComponent isDisabled={ this.state.isDisabled }>
						<Form />
					</DisabledComponent>
				);
			}
		}

		const wrapper = TestUtils.renderIntoDocument( <MaybeDisable /> );

		const input = TestUtils.findRenderedDOMComponentWithTag(
			wrapper,
			'input'
		);
		const div = TestUtils.scryRenderedDOMComponentsWithTag(
			wrapper,
			'div'
		)[ 1 ];

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );

		wrapper.setState( { isDisabled: false } );

		const input2 = TestUtils.findRenderedDOMComponentWithTag(
			wrapper,
			'input'
		);
		const div2 = TestUtils.scryRenderedDOMComponentsWithTag(
			wrapper,
			'div'
		)[ 0 ];

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
		class DisabledStatus extends Component {
			render() {
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
		}

		test( "lets components know that they're disabled via context", () => {
			const wrapper = TestUtils.renderIntoDocument(
				<DisabledComponent>
					<DisabledStatus />
				</DisabledComponent>
			);
			const wrapperElement = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'p'
			);
			expect( wrapperElement.textContent ).toBe( 'Disabled' );
		} );

		test( "lets components know that they're not disabled via context when isDisabled is false", () => {
			const wrapper = TestUtils.renderIntoDocument(
				<DisabledComponent isDisabled={ false }>
					<DisabledStatus />
				</DisabledComponent>
			);
			const wrapperElement = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'p'
			);
			expect( wrapperElement.textContent ).toBe( 'Not disabled' );
		} );

		test( "lets components know that they're not disabled via context", () => {
			const wrapper = TestUtils.renderIntoDocument( <DisabledStatus /> );
			const wrapperElement = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'p'
			);
			expect( wrapperElement.textContent ).toBe( 'Not disabled' );
		} );
	} );
} );
