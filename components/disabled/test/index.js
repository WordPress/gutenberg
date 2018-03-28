/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Disabled from '../';

jest.mock( '@wordpress/utils', () => {
	const focus = require.requireActual( '@wordpress/utils' ).focus;

	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					[ ...context.querySelectorAll( '*' ) ].forEach( ( element ) => {
						Object.defineProperties( element, {
							offsetWidth: {
								get: () => 1,
							},
						} );
					} );

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
		window.MutationObserver = function() {};
		window.MutationObserver.prototype = {
			observe() {},
			disconnect() {},
		};
	} );

	afterAll( () => {
		window.MutationObserver = MutationObserver;
	} );

	const Form = () => <form><input /><div contentEditable /></form>;

	it( 'will disable all fields', () => {
		const wrapper = mount( <Disabled><Form /></Disabled> );

		expect( wrapper.find( 'input' ).getDOMNode().hasAttribute( 'disabled' ) ).toBe( true );
		expect( wrapper.find( '[contentEditable]' ).getDOMNode().getAttribute( 'contenteditable' ) ).toBe( 'false' );
	} );

	it( 'should cleanly un-disable via reconciliation', () => {
		// If this test suddenly starts failing, it means React has become
		// smarter about reusing children into grandfather element when the
		// parent is dropped, so we'd need to find another way to restore
		// original form state.
		function MaybeDisable( { isDisabled = true } ) {
			const element = <Form />;
			return isDisabled ? <Disabled>{ element }</Disabled> : element;
		}

		const wrapper = mount( <MaybeDisable /> );
		wrapper.setProps( { isDisabled: false } );

		expect( wrapper.find( 'input' ).getDOMNode().hasAttribute( 'disabled' ) ).toBe( false );
		expect( wrapper.find( '[contentEditable]' ).getDOMNode().getAttribute( 'contenteditable' ) ).toBe( 'true' );
	} );

	// Ideally, we'd have two more test cases here:
	//
	//  - it( 'will disable all fields on component render change' )
	//  - it( 'will disable all fields on sneaky DOM manipulation' )
	//
	// Alas, JSDOM does not support MutationObserver:
	//
	//  https://github.com/jsdom/jsdom/issues/639
} );
