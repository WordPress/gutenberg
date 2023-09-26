/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { insert, remove } from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { splitValue } from './split-value';

export function useEnter( props ) {
	const registry = useRegistry();
	const { __unstableMarkAutomaticChange } = useDispatch( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode !== ENTER ) {
				return;
			}

			const {
				removeEditorOnlyFormats,
				value,
				onReplace,
				onSplit,
				onChange,
				disableLineBreaks,
				onSplitAtEnd,
				onSplitAtDoubleLineEnd,
			} = propsRef.current;

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

			const { text, start, end } = _value;

			if ( event.shiftKey ) {
				if ( ! disableLineBreaks ) {
					onChange( insert( _value, '\n' ) );
				}
			} else if ( canSplit ) {
				splitValue( {
					value: _value,
					onReplace,
					onSplit,
				} );
			} else if ( onSplitAtEnd && start === end && end === text.length ) {
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
					_value.start = _value.end - 2;
					onChange( remove( _value ) );
					onSplitAtDoubleLineEnd();
				} );
			} else if ( ! disableLineBreaks ) {
				onChange( insert( _value, '\n' ) );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
