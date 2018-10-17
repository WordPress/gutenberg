/**
 * External dependencies
 */
import { noop } from 'lodash';
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../';

describe( 'KeyboardShortcuts', () => {
	afterEach( () => {
		while ( document.body.firstChild ) {
			document.body.removeChild( document.body.firstChild );
		}
	} );

	function keyPress( which, target ) {
		[ 'keydown', 'keypress', 'keyup' ].forEach( ( eventName ) => {
			const event = new window.Event( eventName, { bubbles: true } );
			event.keyCode = which;
			event.which = which;
			target.dispatchEvent( event );
		} );
	}

	it( 'should capture key events', () => {
		const spy = jest.fn();
		mount(
			<KeyboardShortcuts
				shortcuts={ {
					d: spy,
				} } />
		);

		keyPress( 68, document );

		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should capture key events globally', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<div>
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						d: spy,
					} } />
				<textarea></textarea>
			</div>,
			{ attachTo: attachNode }
		);

		keyPress( 68, wrapper.find( 'textarea' ).getDOMNode() );

		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should capture key events on specific event', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<div>
				<KeyboardShortcuts
					eventName="keyup"
					shortcuts={ {
						d: spy,
					} } />
				<textarea></textarea>
			</div>,
			{ attachTo: attachNode }
		);

		keyPress( 68, wrapper.find( 'textarea' ).getDOMNode() );

		expect( spy ).toHaveBeenCalled();
		expect( spy.mock.calls[ 0 ][ 0 ].type ).toBe( 'keyup' );
	} );

	it( 'should capture key events on children', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<div>
				<KeyboardShortcuts
					shortcuts={ {
						d: spy,
					} }
				>
					<textarea></textarea>
				</KeyboardShortcuts>
				<textarea></textarea>
			</div>,
			{ attachTo: attachNode }
		);

		const textareas = wrapper.find( 'textarea' );

		// Outside scope
		keyPress( 68, textareas.at( 1 ).getDOMNode() );
		expect( spy ).not.toHaveBeenCalled();

		// Inside scope
		keyPress( 68, textareas.at( 0 ).getDOMNode() );
		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should continue to bubble to ancestors', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<KeyboardShortcuts
				shortcuts={ {
					d: spy,
				} }
			>
				<KeyboardShortcuts
					shortcuts={ {
						d: noop,
					} }
				>
					<textarea></textarea>
				</KeyboardShortcuts>
			</KeyboardShortcuts>,
			{ attachTo: attachNode }
		);

		const textareas = wrapper.find( 'textarea' );

		keyPress( 68, textareas.at( 0 ).getDOMNode() );
		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should ignore events on child handled', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<KeyboardShortcuts
				ignoreChildHandled
				shortcuts={ {
					d: spy,
				} }
			>
				<KeyboardShortcuts
					shortcuts={ {
						d: noop,
					} }
				>
					<textarea></textarea>
				</KeyboardShortcuts>
			</KeyboardShortcuts>,
			{ attachTo: attachNode }
		);

		const textareas = wrapper.find( 'textarea' );

		keyPress( 68, textareas.at( 0 ).getDOMNode() );
		expect( spy ).not.toHaveBeenCalled();
	} );

	it( 'should propagate events on child handled', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount(
			<div onKeyDown={ spy }>
				<KeyboardShortcuts
					ignoreChildHandled
					shortcuts={ {
						d: noop,
					} }
				>
					<KeyboardShortcuts
						shortcuts={ {
							d: noop,
						} }
					>
						<textarea></textarea>
					</KeyboardShortcuts>
				</KeyboardShortcuts>
			</div>,
			{ attachTo: attachNode }
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		const textareas = wrapper.find( 'textarea' );

		keyPress( 68, textareas.at( 0 ).getDOMNode() );
		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should handle if ignoreChildHandled but not handled by child', () => {
		const spy = jest.fn();
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<KeyboardShortcuts
				ignoreChildHandled
				shortcuts={ {
					d: spy,
				} }
			>
				<textarea></textarea>
			</KeyboardShortcuts>,
			{ attachTo: attachNode }
		);

		const textareas = wrapper.find( 'textarea' );

		keyPress( 68, textareas.at( 0 ).getDOMNode() );
		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should passes through props to children wrapper', () => {
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		const wrapper = mount(
			<KeyboardShortcuts
				ignoreChildHandled
				shortcuts={ {} }
				className="is-ok"
			>
				<textarea></textarea>
			</KeyboardShortcuts>,
			{ attachTo: attachNode }
		);

		expect( wrapper.getDOMNode().outerHTML ).toMatchSnapshot();
	} );
} );
