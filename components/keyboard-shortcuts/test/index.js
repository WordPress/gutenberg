/**
 * External dependencies
 */
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
					shortcuts={ {
						d: [ spy, true ],
					} } />
				<textarea></textarea>
			</div>,
			{ attachTo: attachNode }
		);

		keyPress( 68, wrapper.find( 'textarea' ).getDOMNode() );

		expect( spy ).toHaveBeenCalled();
	} );
} );
