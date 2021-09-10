/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import {
	insert,
	__unstableIsEmptyLine as isEmptyLine,
	__unstableInsertLineSeparator as insertLineSeparator,
} from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { splitValue } from './split-value';

export function useEnter( props ) {
	const { __unstableMarkAutomaticChange } = useDispatch( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			const {
				removeEditorOnlyFormats,
				value,
				onReplace,
				onSplit,
				onSplitMiddle,
				multilineTag,
				onChange,
				disableLineBreaks,
				onSplitAtEnd,
			} = propsRef.current;

			if ( event.keyCode !== ENTER ) {
				return;
			}

			event.preventDefault();

			const _value = { ...value };
			_value.formats = removeEditorOnlyFormats( value );
			const canSplit = onReplace && onSplit;

			if ( onReplace ) {
				const transforms = getBlockTransforms( 'from' ).filter(
					( { type } ) => type === 'enter'
				);
				const transformation = findTransform( transforms, ( item ) => {
					return item.regExp.test( _value.text );
				} );

				if ( transformation ) {
					onReplace( [
						transformation.transform( {
							content: _value.text,
						} ),
					] );
					__unstableMarkAutomaticChange();
				}
			}

			if ( multilineTag ) {
				if ( event.shiftKey ) {
					if ( ! disableLineBreaks ) {
						onChange( insert( _value, '\n' ) );
					}
				} else if ( canSplit && isEmptyLine( _value ) ) {
					splitValue( {
						value: _value,
						onReplace,
						onSplit,
						onSplitMiddle,
						multilineTag,
					} );
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
					splitValue( {
						value: _value,
						onReplace,
						onSplit,
						onSplitMiddle,
						multilineTag,
					} );
				}
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
