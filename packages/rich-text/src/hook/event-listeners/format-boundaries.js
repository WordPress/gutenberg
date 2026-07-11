/**
 * WordPress dependencies
 */
import { LEFT, RIGHT } from '@wordpress/keycodes';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isCollapsed } from '../../is-collapsed';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

const EMPTY_ACTIVE_FORMATS = [];

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

		if (
			// Only override left and right keys without modifiers pressed.
			shiftKey ||
			altKey ||
			metaKey ||
			ctrlKey ||
			( keyCode !== LEFT && keyCode !== RIGHT )
		) {
			return;
		}

		const { record, applyRecord, forceRender, getValue } = props.current;
		const value = getValue();
		const {
			text,
			formats,
			start,
			end,
			activeFormats: currentActiveFormats = [],
		} = value;
		const collapsed = isCollapsed( value );
		const { defaultView } = element.ownerDocument;
		// To do: ideally, we should look at visual position instead.
		const { direction } = defaultView.getComputedStyle( element );
		const reverseKey = direction === 'rtl' ? RIGHT : LEFT;
		const isReverse = event.keyCode === reverseKey;

		// If the selection is collapsed and at the very start, do nothing if
		// navigating backward.
		// If the selection is collapsed and at the very end, do nothing if
		// navigating forward.
		if ( collapsed && currentActiveFormats.length === 0 ) {
			if ( start === 0 && isReverse ) {
				return;
			}

			if ( end === text.length && ! isReverse ) {
				return;
			}
		}

		// If the selection is not collapsed, let the browser handle collapsing
		// the selection for now. Later we could expand this logic to set
		// boundary positions if needed.
		if ( ! collapsed ) {
			return;
		}

		const formatsBefore = formats[ start - 1 ] || EMPTY_ACTIVE_FORMATS;
		const formatsAfter = formats[ start ] || EMPTY_ACTIVE_FORMATS;
		const destination = isReverse ? formatsBefore : formatsAfter;
		const isIncreasing = currentActiveFormats.every(
			( format, index ) => format === destination[ index ]
		);

		let newActiveFormatsLength = currentActiveFormats.length;

		if ( ! isIncreasing ) {
			newActiveFormatsLength--;
		} else if ( newActiveFormatsLength < destination.length ) {
			newActiveFormatsLength++;
		}

		if ( newActiveFormatsLength === currentActiveFormats.length ) {
			record.current._newActiveFormats = destination;
			return;
		}

		event.preventDefault();

		const origin = isReverse ? formatsAfter : formatsBefore;
		const source = isIncreasing ? destination : origin;
		const newActiveFormats = source.slice( 0, newActiveFormatsLength );
		// Only the active formats change: base the new record on the current
		// record, not the value derived from the DOM selection. Writing
		// derived offsets here would hide a pending selection change from
		// the `selectionchange` handler, which would then never dispatch it
		// to the store.
		const newValue = {
			...record.current,
			activeFormats: newActiveFormats,
		};
		record.current = newValue;
		applyRecord( newValue );
		forceRender();
	}

	return subscribeDelegatedListener( element, 'keydown', onKeyDown, true );
};
