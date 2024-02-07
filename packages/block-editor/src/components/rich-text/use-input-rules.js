/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { remove, toHTMLString } from '@wordpress/rich-text';
import {
	getBlockTransforms,
	findTransform,
	lazyLoadBlock,
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

function findPrefixTransform( prefixText ) {
	const prefixTransforms = getBlockTransforms( 'from' ).filter(
		( t ) => t.type === 'prefix'
	);
	return findTransform( prefixTransforms, ( t ) => t.prefix === prefixText );
}

function inputRule( props, ctx, onReplace ) {
	const { getValue, onChange, selectionChange } = props;

	if ( ! ctx.inserterActive ) {
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
	const transformation = findPrefixTransform( trimmedTextBefore );
	if ( ! transformation ) {
		return;
	}

	// remove the prefix string from the input because it's going to be processed by the transform
	onChange( remove( value, 0, start ) );

	const block = transformation.transform( START_OF_SELECTED_AREA );
	const selection = findSelection( [ block ] );
	if ( selection ) {
		ctx.inserterActive = selection[ 0 ].name === 'core/paragraph';
	}
	lazyLoadBlock( block ).then( () => {
		if ( selection ) {
			const [ selectedBlock, selectedAttribute ] = selection;
			const valueStr = toHTMLString( { value: getValue() } );
			// To do: refactor this to use rich text's selection instead, so
			// we no longer have to use on this hack inserting a special
			// character.
			selectedBlock.attributes[ selectedAttribute ] =
				selectedBlock.attributes[ selectedAttribute ]
					.toString()
					.replace( START_OF_SELECTED_AREA, valueStr );
			selectionChange( selectedBlock.clientId, selectedAttribute, 0, 0 );
		}
		onReplace( [ block ] );
	} );

	return true;
}

export function useInputRules( props ) {
	const {
		__unstableMarkLastChangeAsPersistent,
		__unstableMarkAutomaticChange,
	} = useDispatch( blockEditorStore );

	const propsRef = useRef( props );
	propsRef.current = props;

	const transformCtxRef = useRef( {
		inserterActive: props.__unstableAllowPrefixTransformations,
	} );

	return useRefEffect( ( element ) => {
		function onInput( event ) {
			const { inputType, type } = event;
			const { getValue, onChange, onReplace, formatTypes } =
				propsRef.current;

			// Only run input rules when inserting text.
			if ( inputType !== 'insertText' && type !== 'compositionend' ) {
				return;
			}

			if (
				onReplace &&
				inputRule(
					propsRef.current,
					transformCtxRef.current,
					( blocks ) => {
						onReplace( blocks );
						__unstableMarkAutomaticChange();
					}
				)
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
