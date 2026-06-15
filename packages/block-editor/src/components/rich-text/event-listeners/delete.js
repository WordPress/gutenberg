/**
 * WordPress dependencies
 */
import { DELETE, BACKSPACE } from '@wordpress/keycodes';
import { isCollapsed, isEmpty } from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		const { value, onMerge, onRemove } = props.current;

		if ( keyCode === DELETE || keyCode === BACKSPACE ) {
			const { start, end, text } = value;
			const isReverse = keyCode === BACKSPACE;
			const hasActiveFormats =
				value.activeFormats && !! value.activeFormats.length;

			// Only process delete if the key press occurs at an uncollapsed edge.
			if (
				! isCollapsed( value ) ||
				hasActiveFormats ||
				( isReverse && start !== 0 ) ||
				( ! isReverse && end !== text.length )
			) {
				return;
			}

			if ( onMerge ) {
				onMerge( ! isReverse );
			}

			// Only handle remove on Backspace. This serves dual-purpose of being
			// an intentional user interaction distinguishing between Backspace and
			// Delete to remove the empty field, but also to avoid merge & remove
			// causing destruction of two fields (merge, then removed merged).
			else if ( onRemove && isEmpty( value ) && isReverse ) {
				onRemove( ! isReverse );
			}

			event.preventDefault();
		}
	}

	return subscribeDelegatedListener( element, 'keydown', onKeyDown );
};
