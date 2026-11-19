import { DELETE, BACKSPACE } from '@wordpress/keycodes';
import {
	isCollapsed,
	isEmpty,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const deleteListener: RichTextEventListener = ( props ) => ( element ) => {
	function onKeyDown( event: KeyboardEvent ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		const { value, onMerge, onRemove } = props.current;

		if ( keyCode === DELETE || keyCode === BACKSPACE ) {
			const { start, end, text } = value;
			const isReverse = keyCode === BACKSPACE;

			// Only process delete if the key press occurs at a collapsed edge.
			// Active formats at that edge must still merge through the store.
			// Letting the browser handle the key removes the element from the
			// canvas while both blocks remain in the list.
			if (
				! isCollapsed( value ) ||
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

	return subscribeOwnedListener( element, 'keydown', onKeyDown );
};

export default deleteListener;
