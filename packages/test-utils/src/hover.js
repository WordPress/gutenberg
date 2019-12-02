/**
 * External dependencies
 */
import { fireEvent as domFireEvent } from '@testing-library/dom';

/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import act from './act';
import getDocument from './utils/get-document';

/**
 * Hover element.
 *
 * @param {Element} element
 * @param {Object} [options]
 */
export default function hover( element, options ) {
	const document = getDocument( element );
	const { lastHovered } = document;
	const { disabled } = element;

	if ( lastHovered ) {
		fireEvent.pointerMove( lastHovered, options );
		fireEvent.mouseMove( lastHovered, options );

		const isElementWithinLastHovered = lastHovered.contains( element );

		fireEvent.pointerOut( lastHovered, options );

		if ( ! isElementWithinLastHovered ) {
			fireEvent.pointerLeave( lastHovered, options );
		}

		fireEvent.mouseOut( lastHovered, options );

		if ( ! isElementWithinLastHovered ) {
			act( () => {
				// fireEvent.mouseLeave would be the same as fireEvent.mouseOut
				domFireEvent.mouseLeave( lastHovered, options );
			} );
		}
	}

	fireEvent.pointerOver( element, options );
	fireEvent.pointerEnter( element, options );

	if ( ! disabled ) {
		fireEvent.mouseOver( element, options );
		act( () => {
			// fireEvent.mouseEnter would be the same as fireEvent.mouseOver
			domFireEvent.mouseEnter( element, options );
		} );
	}

	fireEvent.pointerMove( element, options );

	if ( ! disabled ) {
		fireEvent.mouseMove( element, options );
	}

	document.lastHovered = element;
}
