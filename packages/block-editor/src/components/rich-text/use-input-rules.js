/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { remove, toHTMLString } from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
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

function findPrefixTransform( prefixText ) {
	const prefixTransforms = getBlockTransforms( 'from' ).filter(
		( t ) => t.type === 'prefix'
	);
	return findTransform( prefixTransforms, ( t ) => t.prefix === prefixText );
}

function inputRule( props, onReplace ) {
	const { getValue, selectionChange } = props;

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
	const transformation = findPrefixTransform( trimmedTextBefore );
	if ( ! transformation ) {
		return;
	}

	const block = transformation.transform( START_OF_SELECTED_AREA );
	const selection = findSelection( [ block ] );
	if ( selection ) {
		const [ selectedBlock, selectedAttribute ] = selection;
		// To do: refactor this to use rich text's selection instead, so
		// we no longer have to use on this hack inserting a special
		// character.
		const newValue = selectedBlock.attributes[ selectedAttribute ]
			.toString()
			.replace(
				START_OF_SELECTED_AREA,
				toHTMLString( { value: remove( value, 0, start ) } )
			);

		selectedBlock.attributes[ selectedAttribute ] = newValue;
		selectionChange(
			selectedBlock.clientId,
			selectedAttribute,
			newValue.length,
			newValue.length
		);
	}
	onReplace( [ block ] );

	return true;
}

export function useInputRules( props ) {
	const {
		__unstableMarkLastChangeAsPersistent,
		__unstableMarkAutomaticChange,
	} = useDispatch( blockEditorStore );

	const propsRef = useRef( props );
	propsRef.current = props;

	return useRefEffect( ( element ) => {
		function onInput( event ) {
			const { inputType, type } = event;
			const {
				getValue,
				onChange,
				onReplace,
				formatTypes,
				__unstableAllowPrefixTransformations,
			} = propsRef.current;

			// Only run input rules when inserting text.
			if ( inputType !== 'insertText' && type !== 'compositionend' ) {
				return;
			}

			if (
				onReplace &&
				__unstableAllowPrefixTransformations &&
				inputRule( propsRef.current, ( blocks ) => {
					onReplace( blocks );
					__unstableMarkAutomaticChange();
				} )
			) {
				return;
			}

			const value = getValue();
			const transformed = formatTypes.reduce(
				( accumulator, { __unstableInputRule } ) => {
					if ( __unstableInputRule ) {
						return __unstableInputRule( accumulator );
					}

					return accumulator;
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
