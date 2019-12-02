/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import focus from './focus';
import hover from './hover';
import blur from './blur';
import isFocusable from './utils/is-focusable';
import subscribeDefaultPrevented from './utils/subscribe-default-prevented';
import getClosestFocusable from './utils/get-closest-focusable';

/**
 * @param {Element} element
 * @return {HTMLLabelElement} Closest label element
 */
function getClosestLabel( element ) {
	if ( ! isFocusable( element ) ) {
		return element.closest( 'label' );
	}
	return null;
}

/**
 * @param {HTMLLabelElement} element
 * @return {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} Input element
 */
function getInputFromLabel( element ) {
	const input = element.htmlFor ?
		element.ownerDocument.getElementById( element.htmlFor ) :
		element.querySelector( 'input,textarea,select' );
	return input;
}

/**
 *
 * @param {HTMLLabelElement} element
 * @param {Object} defaultPrevented
 * @param {Object} options
 */
function clickLabel(
	element,
	defaultPrevented,
	options
) {
	const input = getInputFromLabel( element );
	const isInputDisabled = Boolean( input && input.disabled );

	if ( input ) {
		// JSDOM will automatically "click" input right after we "click" the label.
		// Since we need to "focus" it first, we temporarily disable it so it won't
		// get automatically clicked.
		input.disabled = true;
	}

	fireEvent.click( element, options );

	if ( input ) {
		// Now we can revert input disabled state and fire events on it in the
		// right order.
		input.disabled = isInputDisabled;
		if ( ! defaultPrevented.current && isFocusable( input ) ) {
			focus( input );
			// Only "click" is fired! Browsers don't go over the whole event stack in
			// this case (mousedown, mouseup etc.).
			fireEvent.click( input );
		}
	}
}

/**
 * @param {HTMLOptionElement} element
 * @param {boolean} selected
 */
function setSelected( element, selected ) {
	element.setAttribute( 'selected', selected ? 'selected' : '' );
	element.selected = selected;
}

/**
 * @param {HTMLOptionElement} element
 * @param {Object} eventOptions
 */
function clickOption(
	element,
	eventOptions
) {
	const select = element.closest( 'select' );

	if ( ! select ) {
		fireEvent.click( element, eventOptions );
		return;
	}

	if ( select.multiple ) {
		const options = Array.from( select.options );

		const resetOptions = () =>
			options.forEach( ( option ) => {
				setSelected( option, false );
			} );

		const selectRange = ( a, b ) => {
			const from = Math.min( a, b );
			const to = Math.max( a, b ) + 1;
			const selectedOptions = options.slice( from, to );
			selectedOptions.forEach( ( option ) => {
				setSelected( option, true );
			} );
		};

		if ( eventOptions.shiftKey ) {
			const elementIndex = options.indexOf( element );
			// https://stackoverflow.com/a/16530782/5513909
			const referenceOption = select.lastOptionSelectedNotByShiftKey;
			const referenceOptionIndex = referenceOption ?
				options.indexOf( referenceOption ) :
				-1;

			resetOptions();
			// Select options between the reference option and the clicked element
			selectRange( elementIndex, referenceOptionIndex );
			setSelected( element, true );
		} else {
			// Keep track of this option as this will be used later when shift key
			// is used.
			select.lastOptionSelectedNotByShiftKey = element;

			if ( eventOptions.ctrlKey ) {
				// Clicking with ctrlKey will select/deselect the option
				setSelected( element, ! element.selected );
			} else {
				// Simply clicking an option will select only that option
				resetOptions();
				setSelected( element, true );
			}
		}
	} else {
		setSelected( element, true );
	}

	fireEvent.input( select );
	fireEvent.change( select );
	fireEvent.click( element, eventOptions );
}

/**
 * Click element.
 *
 * @param {Element} element
 * @param {Object} [options]
 */
export default function click( element, options = {} ) {
	hover( element, options );
	const { disabled } = element;

	let defaultPrevented = subscribeDefaultPrevented(
		element,
		'pointerdown',
		'mousedown'
	);

	fireEvent.pointerDown( element, options );

	if ( ! disabled ) {
		// Mouse events are not called on disabled elements
		fireEvent.mouseDown( element, options );
	}

	if ( ! defaultPrevented.current ) {
		// Do not enter this if event.preventDefault() has been called on
		// pointerdown or mousedown.
		if ( isFocusable( element ) ) {
			focus( element );
		} else if ( ! disabled ) {
			// If the element is not focusable, focus the closest focusable parent
			const closestFocusable = getClosestFocusable( element );
			if ( closestFocusable ) {
				focus( closestFocusable );
			} else {
				// This will automatically set document.body as the activeElement
				blur();
			}
		}
	}

	defaultPrevented = subscribeDefaultPrevented( element, 'click' );

	fireEvent.pointerUp( element, options );

	// mouseup and click are not called on disabled elements
	if ( disabled ) {
		return;
	}

	fireEvent.mouseUp( element, options );

	const label = getClosestLabel( element );

	if ( label ) {
		clickLabel( label, defaultPrevented, options );
	} else if ( element.tagName === 'OPTION' ) {
		clickOption( element, options );
	} else {
		fireEvent.click( element, options );
	}

	defaultPrevented.unsubscribe();
}
