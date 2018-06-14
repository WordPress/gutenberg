/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Disabled from '../';

jest.mock( '@wordpress/dom', () => {
	const focus = require.requireActual( '@wordpress/dom' ).focus;

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

	const Form = () => <form><input /><div contentEditable tabIndex="0" /></form>;

	// Skipped temporarily until Enzyme publishes new version that works with React 16.3.0 APIs.
	// eslint-disable-next-line jest/no-disabled-tests
	test.skip( 'will disable all fields', () => {
		const wrapper = mount( <Disabled><Form /></Disabled> );

		const input = wrapper.find( 'input' ).getDOMNode();
		const div = wrapper.find( '[contentEditable]' ).getDOMNode();

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		expect( div.hasAttribute( 'tabindex' ) ).toBe( false );
		expect( div.hasAttribute( 'disabled' ) ).toBe( false );
	} );

	// Skipped temporarily until Enzyme publishes new version that works with React 16.3.0 APIs.
	// eslint-disable-next-line jest/no-disabled-tests
	test.skip( 'should cleanly un-disable via reconciliation', () => {
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

		const input = wrapper.find( 'input' ).getDOMNode();
		const div = wrapper.find( '[contentEditable]' ).getDOMNode();

		expect( input.hasAttribute( 'disabled' ) ).toBe( false );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'true' );
		expect( div.hasAttribute( 'tabindex' ) ).toBe( true );
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
						{ ( isDisabled ) => isDisabled ? 'Disabled' : 'Not disabled' }
					</Disabled.Consumer>
				</p>
			);
		}

		// Skipped temporarily until Enzyme publishes new version that works with React 16.3.0 APIs.
		// eslint-disable-next-line jest/no-disabled-tests
		test.skip( 'lets components know that they\'re disabled via context', () => {
			const wrapper = mount( <Disabled><DisabledStatus /></Disabled> );
			expect( wrapper.text() ).toBe( 'Disabled' );
		} );

		// Skipped temporarily until Enzyme publishes new version that works with React 16.3.0 APIs.
		// eslint-disable-next-line jest/no-disabled-tests
		test.skip( 'lets components know that they\'re not disabled via context', () => {
			const wrapper = mount( <DisabledStatus /> );
			expect( wrapper.text() ).toBe( 'Not disabled' );
		} );
	} );
} );
