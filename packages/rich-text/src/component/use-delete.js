/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { remove } from '../remove';
import { removeLineSeparator } from '../remove-line-separator';
import { isEmptyLine } from '../is-empty';

export function useDelete( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;
			const { record, handleChange, multilineTag } = propsRef.current;

			if ( event.defaultPrevented ) {
				return;
			}

			if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
				return;
			}

			const { start, end, text } = record;
			const isReverse = keyCode === BACKSPACE;

			// Always handle full content deletion ourselves.
			if ( start === 0 && end !== 0 && end === text.length ) {
				handleChange( remove( record ) );
				event.preventDefault();
				return;
			}

			if ( multilineTag ) {
				let newValue;

				// Check to see if we should remove the first item if empty.
				if (
					isReverse &&
					record.start === 0 &&
					record.end === 0 &&
					isEmptyLine( record )
				) {
					newValue = removeLineSeparator( record, ! isReverse );
				} else {
					newValue = removeLineSeparator( record, isReverse );
				}

				if ( newValue ) {
					handleChange( newValue );
					event.preventDefault();
				}
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
