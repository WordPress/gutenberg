/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { isCollapsed } from '../is-collapsed';
import { LINE_SEPARATOR } from '../special-characters';
import { indentListItems } from '../indent-list-items';

export function useIndentListItemOnSpace( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;
			const {
				multilineTag,
				createRecord,
				handleChange,
			} = propsRef.current;

			if (
				// Only override when no modifiers are pressed.
				shiftKey ||
				altKey ||
				metaKey ||
				ctrlKey ||
				keyCode !== SPACE ||
				multilineTag !== 'li'
			) {
				return;
			}

			const currentValue = createRecord();

			if ( ! isCollapsed( currentValue ) ) {
				return;
			}

			const { text, start } = currentValue;
			const characterBefore = text[ start - 1 ];

			// The caret must be at the start of a line.
			if ( characterBefore && characterBefore !== LINE_SEPARATOR ) {
				return;
			}

			handleChange(
				indentListItems( currentValue, {
					type: element.tagName.toLowerCase(),
				} )
			);
			event.preventDefault();
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
