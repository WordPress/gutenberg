/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import {
	isCollapsed,
	isEmpty,
	insert,
	__unstableIsEmptyLine as isEmptyLine,
	__unstableInsertLineSeparator as insertLineSeparator,
} from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';

export function useEnterDeleteHandler( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;

			if ( event.defaultPrevented ) {
				return;
			}

			const {
				removeEditorOnlyFormats,
				value,
				onReplace,
				onSplit,
				__unstableMarkAutomaticChange,
				multiline,
				onChange,
				disableLineBreaks,
				splitValue,
				onSplitAtEnd,
				hasActiveFormats,
				onMerge,
				onRemove,
			} = propsRef.current;

			if ( event.keyCode === ENTER ) {
				event.preventDefault();

				const _value = { ...value };
				_value.formats = removeEditorOnlyFormats( value );
				const canSplit = onReplace && onSplit;

				if ( onReplace ) {
					const transforms = getBlockTransforms( 'from' ).filter(
						( { type } ) => type === 'enter'
					);
					const transformation = findTransform(
						transforms,
						( item ) => {
							return item.regExp.test( _value.text );
						}
					);

					if ( transformation ) {
						onReplace( [
							transformation.transform( {
								content: _value.text,
							} ),
						] );
						__unstableMarkAutomaticChange();
					}
				}

				if ( multiline ) {
					if ( event.shiftKey ) {
						if ( ! disableLineBreaks ) {
							onChange( insert( _value, '\n' ) );
						}
					} else if ( canSplit && isEmptyLine( _value ) ) {
						splitValue( _value );
					} else {
						onChange( insertLineSeparator( _value ) );
					}
				} else {
					const { text, start, end } = _value;
					const canSplitAtEnd =
						onSplitAtEnd && start === end && end === text.length;

					if ( event.shiftKey || ( ! canSplit && ! canSplitAtEnd ) ) {
						if ( ! disableLineBreaks ) {
							onChange( insert( _value, '\n' ) );
						}
					} else if ( ! canSplit && canSplitAtEnd ) {
						onSplitAtEnd();
					} else if ( canSplit ) {
						splitValue( _value );
					}
				}
			} else if ( keyCode === DELETE || keyCode === BACKSPACE ) {
				const { start, end, text } = value;
				const isReverse = keyCode === BACKSPACE;

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
				if ( onRemove && isEmpty( value ) && isReverse ) {
					onRemove( ! isReverse );
				}

				event.preventDefault();
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
