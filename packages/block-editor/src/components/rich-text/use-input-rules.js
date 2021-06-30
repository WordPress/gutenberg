/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { slice, toHTMLString } from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useInputRules( props ) {
	const {
		__unstableMarkLastChangeAsPersistent,
		__unstableMarkAutomaticChange,
	} = useDispatch( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function inputRule() {
			const { value, onReplace } = propsRef.current;

			if ( ! onReplace ) {
				return;
			}

			const { start, text } = value;
			const characterBefore = text.slice( start - 1, start );

			// The character right before the caret must be a plain space.
			if ( characterBefore !== ' ' ) {
				return;
			}

			const trimmedTextBefore = text.slice( 0, start ).trim();
			const prefixTransforms = getBlockTransforms( 'from' ).filter(
				( { type } ) => type === 'prefix'
			);
			const transformation = findTransform(
				prefixTransforms,
				( { prefix } ) => {
					return trimmedTextBefore === prefix;
				}
			);

			if ( ! transformation ) {
				return;
			}

			const content = toHTMLString( {
				value: slice( value, start, text.length ),
			} );
			const block = transformation.transform( content );

			onReplace( [ block ] );
			__unstableMarkAutomaticChange();
		}

		function onInput( event ) {
			const { inputType } = event;
			const {
				value,
				onChange,
				__unstableAllowPrefixTransformations,
				formatTypes,
			} = propsRef.current;

			// Only run input rules when inserting text.
			if ( inputType !== 'insertText' ) {
				return;
			}

			if ( __unstableAllowPrefixTransformations && inputRule ) {
				inputRule();
			}

			const transformed = formatTypes.reduce(
				( accumlator, { __unstableInputRule } ) => {
					if ( __unstableInputRule ) {
						accumlator = __unstableInputRule( accumlator );
					}

					return accumlator;
				},
				value
			);

			if ( transformed !== value ) {
				__unstableMarkLastChangeAsPersistent();
				onChange( {
					...transformed,
					activeFormats: value.activeFormats,
				} );
				__unstableMarkAutomaticChange();
			}
		}

		element.addEventListener( 'input', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
		};
	}, [] );
}
