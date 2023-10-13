/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { insert, remove } from '@wordpress/rich-text';
import { useRegistry } from '@wordpress/data';

export function useEnter( { isSelected, ...props } ) {
	const registry = useRegistry();
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect(
		( element ) => {
			if ( ! isSelected ) {
				return;
			}

			function onKeyDownDeprecated( event ) {
				if ( event.keyCode !== ENTER ) {
					return;
				}

				const { onReplace, onSplit } = propsRef.current;

				if ( onReplace && onSplit ) {
					event.__deprecatedOnSplit = true;
				}
			}

			function onKeyDown( event ) {
				if ( event.defaultPrevented ) {
					return;
				}

				if ( event.target !== element ) {
					return;
				}

				if ( event.keyCode !== ENTER ) {
					return;
				}

				const {
					value,
					onChange,
					disableLineBreaks,
					onSplitAtEnd,
					onSplitAtDoubleLineEnd,
				} = propsRef.current;

				event.preventDefault();

				const { text, start, end } = value;

				if ( event.shiftKey ) {
					if ( ! disableLineBreaks ) {
						onChange( insert( value, '\n' ) );
					}
				} else if (
					onSplitAtEnd &&
					start === end &&
					end === text.length
				) {
					onSplitAtEnd();
				} else if (
					// For some blocks it's desirable to split at the end of the
					// block when there are two line breaks at the end of the
					// block, so triple Enter exits the block.
					onSplitAtDoubleLineEnd &&
					start === end &&
					end === text.length &&
					text.slice( -2 ) === '\n\n'
				) {
					registry.batch( () => {
						const _value = { ...value };
						_value.start = _value.end - 2;
						onChange( remove( _value ) );
						onSplitAtDoubleLineEnd();
					} );
				} else if ( ! disableLineBreaks ) {
					onChange( insert( value, '\n' ) );
				}
			}

			const { defaultView } = element.ownerDocument;

			// Attach the listener to the window so parent elements have the
			// chance to prevent the default behavior.
			defaultView.addEventListener( 'keydown', onKeyDown );
			element.addEventListener( 'keydown', onKeyDownDeprecated );
			return () => {
				defaultView.removeEventListener( 'keydown', onKeyDown );
				element.removeEventListener( 'keydown', onKeyDownDeprecated );
			};
		},
		[ isSelected ]
	);
}
