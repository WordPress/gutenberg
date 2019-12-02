/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import focus from './focus';
import blur from './blur';
import getDocument from './utils/get-document';
import getActiveElement from './utils/get-active-element';
import isBodyElement from './utils/is-body-element';
import isFocusable from './utils/is-focusable';
import getPreviousTabbable from './utils/get-previous-tabbable';
import getNextTabbable from './utils/get-next-tabbable';
import subscribeDefaultPrevented from './utils/subscribe-default-prevented';

const clickableInputTypes = [
	'button',
	'color',
	'file',
	'image',
	'reset',
	'submit',
];

/**
 * @param {HTMLInputElement} element
 * @param {Object} options
 */
function submitFormByPressingEnterOn(
	element,
	options
) {
	const { form } = element;

	if ( ! form ) {
		return;
	}

	const elements = Array.from( form.elements );

	// When pressing enter on an input, the form is submitted only when there is
	// only one of these input types present (or there's a submit button).
	const validTypes = [
		'email',
		'number',
		'password',
		'search',
		'tel',
		'text',
		'url',
	];

	const validInputs = elements.filter(
		( el ) => el.tagName === 'INPUT' && validTypes.includes( el.type )
	);

	const submitButton = elements.find(
		( el ) =>
			( [ 'INPUT', 'BUTTON' ].includes( el.tagName ) ) &&
      el.type === 'submit'
	);

	if ( validInputs.length === 1 || submitButton ) {
		fireEvent.submit( form, options );
	}
}

const keyDownMap = {
	Tab( element, { shiftKey } ) {
		const { body } = getDocument( element );
		const nextElement = shiftKey ?
			getPreviousTabbable( body ) :
			getNextTabbable( body );
		if ( nextElement ) {
			focus( nextElement );
		}
	},

	Enter( element, options ) {
		const nonSubmittableTypes = [ ...clickableInputTypes, 'hidden' ];

		const isClickable =
      element.tagName === 'BUTTON' ||
      ( element.tagName === 'INPUT' &&
        clickableInputTypes.includes( element.type ) );

		const isSubmittable =
      element.tagName === 'INPUT' &&
      ! nonSubmittableTypes.includes( element.type );

		if ( isClickable ) {
			fireEvent.click( element, options );
		} else if ( isSubmittable ) {
			submitFormByPressingEnterOn( element, options );
		}
	},
};

const keyUpMap = {
	// Space
	' ': ( element, options ) => {
		const spaceableTypes = [ ...clickableInputTypes, 'checkbox', 'radio' ];

		const isSpaceable =
      element.tagName === 'BUTTON' ||
      ( element.tagName === 'INPUT' &&
        spaceableTypes.includes( element.type ) );

		if ( isSpaceable ) {
			fireEvent.click( element, options );
		}
	},
};

/**
 * Press element.
 *
 * @param {string} key
 * @param {Element} [element]
 * @param {Object} [options]
 */
export default function press(
	key,
	element,
	options = {}
) {
	const document = getDocument( element );

	// eslint-disable-next-line eqeqeq
	if ( ! element ) {
		element = getActiveElement() || document.body;
	}

	if ( ! element ) {
		return;
	}

	// We can't press on elements that aren't focusable
	if ( ! isFocusable( element ) && ! isBodyElement( element ) ) {
		return;
	}

	// If element is not focused, we should focus it
	if ( getActiveElement( element ) !== element ) {
		if ( isBodyElement( element ) ) {
			blur();
		} else {
			focus( element );
		}
	}

	// Track event.preventDefault() calls so we bail out of keydown/keyup effects
	const defaultPrevented = subscribeDefaultPrevented(
		element,
		'keydown',
		'keyup'
	);

	fireEvent.keyDown( element, { key, ...options } );

	if ( ! defaultPrevented.current && key in keyDownMap && ! options.metaKey ) {
		keyDownMap[ key ]( element, options );
	}

	// If keydown effect changed focus (e.g. Tab), keyup will be triggered on the
	// next element.
	if ( getActiveElement( element ) !== element ) {
		element = getActiveElement( element );
	}

	fireEvent.keyUp( element, { key, ...options } );

	if ( ! defaultPrevented.current && key in keyUpMap && ! options.metaKey ) {
		keyUpMap[ key ]( element, options );
	}

	defaultPrevented.unsubscribe();
}

/**
 * @callback Press
 * @param {Element} [element]
 * @param {Object} [options]
 */
/**
 * @param {string} key
 * @param {Object} [defaultOptions]
 * @return {Press} Press function
 */
function createPress( key, defaultOptions = {} ) {
	return ( element, options = {} ) =>
		press( key, element, { ...defaultOptions, ...options } );
}

press.Escape = createPress( 'Escape' );
press.Tab = createPress( 'Tab' );
press.ShiftTab = createPress( 'Tab', { shiftKey: true } );
press.Enter = createPress( 'Enter' );
press.Space = createPress( ' ' );
press.ArrowUp = createPress( 'ArrowUp' );
press.ArrowRight = createPress( 'ArrowRight' );
press.ArrowDown = createPress( 'ArrowDown' );
press.ArrowLeft = createPress( 'ArrowLeft' );
press.End = createPress( 'End' );
press.Home = createPress( 'Home' );
press.PageUp = createPress( 'PageUp' );
press.PageDown = createPress( 'PageDown' );
