/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { remove, toHTMLString } from '@wordpress/rich-text';
import {
	getBlockType,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { preventEventDiscovery } from './prevent-event-discovery';
import {
	retrieveSelectedAttribute,
	START_OF_SELECTED_AREA,
} from '../../utils/selection';

function findSelection( blocks ) {
	let i = blocks.length;

	while ( i-- ) {
		const block = blocks[ i ];
		const attributeKey = retrieveSelectedAttribute( block.attributes );

		if ( attributeKey ) {
			return [ block, attributeKey ];
		}

		const nestedSelection = findSelection( block.innerBlocks );

		if ( nestedSelection ) {
			return nestedSelection;
		}
	}

	return null;
}

function* getBlockNames( block ) {
	yield block.name;
	if ( ! block.innerBlocks ) {
		return;
	}
	for ( const innerBlock of block.innerBlocks ) {
		yield* getBlockNames( innerBlock );
	}
}

export function useInputRules( props ) {
	const {
		__unstableMarkLastChangeAsPersistent,
		__unstableMarkAutomaticChange,
	} = useDispatch( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		async function inputRule() {
			const { getValue, onChange, onReplace, selectionChange } =
				propsRef.current;

			if ( ! onReplace ) {
				return;
			}

			// We must use getValue() here because value may be update
			// asynchronously.
			const value = getValue();
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
				( { prefix } ) => trimmedTextBefore === prefix
			);

			if ( ! transformation ) {
				return;
			}

			onChange( remove( value, 0, start ) );
			const block = transformation.transform( START_OF_SELECTED_AREA );
			for ( const blockName of getBlockNames( block ) ) {
				const blockType = getBlockType( blockName );
				if ( blockType.lazyEdit ) {
					await blockType.lazyEdit();
				}
			}

			const selection = findSelection( [ block ] );
			if ( selection ) {
				const [ selectedBlock, selectedAttribute ] = selection;
				const valueNow = getValue();
				const valueStr = toHTMLString( { value: valueNow } );
				// To do: refactor this to use rich text's selection instead, so
				// we no longer have to use on this hack inserting a special
				// character.
				selectedBlock.attributes[ selectedAttribute ] =
					selectedBlock.attributes[ selectedAttribute ]
						.toString()
						.replace( START_OF_SELECTED_AREA, valueStr );
				selectionChange(
					selectedBlock.clientId,
					selectedAttribute,
					0,
					0
				);
			}
			onReplace( [ block ] );
			__unstableMarkAutomaticChange();

			return true;
		}

		async function onInput( event ) {
			const { inputType, type } = event;
			const {
				getValue,
				onChange,
				__unstableAllowPrefixTransformations,
				formatTypes,
			} = propsRef.current;

			// Only run input rules when inserting text.
			if ( inputType !== 'insertText' && type !== 'compositionend' ) {
				return;
			}

			if (
				__unstableAllowPrefixTransformations &&
				( await inputRule() )
			) {
				return;
			}

			const value = getValue();
			const transformed = formatTypes.reduce(
				( accumlator, { __unstableInputRule } ) => {
					if ( __unstableInputRule ) {
						accumlator = __unstableInputRule( accumlator );
					}

					return accumlator;
				},
				preventEventDiscovery( value )
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
		element.addEventListener( 'compositionend', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
			element.removeEventListener( 'compositionend', onInput );
		};
	}, [] );
}
