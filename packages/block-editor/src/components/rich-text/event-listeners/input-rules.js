/**
 * WordPress dependencies
 */
import { insert, toHTMLString } from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { preventEventDiscovery } from '../prevent-event-discovery';
import {
	retrieveSelectedAttribute,
	START_OF_SELECTED_AREA,
} from '../../../utils/selection';

export function findSelection( blocks ) {
	let i = blocks.length;

	while ( i-- ) {
		const attributeKey = retrieveSelectedAttribute(
			blocks[ i ].attributes
		);

		if ( attributeKey ) {
			blocks[ i ].attributes[ attributeKey ] = blocks[ i ].attributes[
				attributeKey
			]
				// To do: refactor this to use rich text's selection instead, so
				// we no longer have to use on this hack inserting a special
				// character.
				.toString()
				.replace( START_OF_SELECTED_AREA, '' );
			return [ blocks[ i ].clientId, attributeKey, 0, 0 ];
		}

		const nestedSelection = findSelection( blocks[ i ].innerBlocks );

		if ( nestedSelection ) {
			return nestedSelection;
		}
	}

	return [];
}

export default ( props ) => ( element ) => {
	function inputRule() {
		const { getValue, onReplace, selectionChange, registry } =
			props.current;

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
			( { prefix } ) => {
				return trimmedTextBefore === prefix;
			}
		);

		if ( ! transformation ) {
			return;
		}

		const content = toHTMLString( {
			value: insert( value, START_OF_SELECTED_AREA, 0, start ),
		} );
		const block = transformation.transform( content );

		selectionChange( ...findSelection( [ block ] ) );
		onReplace( [ block ] );
		registry.dispatch( blockEditorStore ).__unstableMarkAutomaticChange();

		return true;
	}

	function onInput( event ) {
		const { inputType, type } = event;
		const {
			getValue,
			onChange,
			__unstableAllowPrefixTransformations,
			formatTypes,
			registry,
		} = props.current;

		// Only run input rules when inserting text.
		if ( inputType !== 'insertText' && type !== 'compositionend' ) {
			return;
		}

		if ( __unstableAllowPrefixTransformations && inputRule() ) {
			return;
		}

		const value = getValue();
		const transformed = formatTypes.reduce(
			( accumulator, { __unstableInputRule } ) => {
				if ( __unstableInputRule ) {
					accumulator = __unstableInputRule( accumulator );
				}

				return accumulator;
			},
			preventEventDiscovery( value )
		);

		const {
			__unstableMarkLastChangeAsPersistent,
			__unstableMarkAutomaticChange,
		} = registry.dispatch( blockEditorStore );

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
};
