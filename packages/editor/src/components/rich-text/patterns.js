/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import {
	remove,
	applyFormat,
	getTextContent,
	getSelectionStart,
	slice,
} from '@wordpress/rich-text';

export function getPatterns( { onReplace, valueToFormat, onCreateUndoLevel } ) {
	const prefixTransforms = getBlockTransforms( 'from' )
		.filter( ( { type } ) => type === 'prefix' );

	return [
		( record ) => {
			if ( ! onReplace ) {
				return record;
			}

			const start = getSelectionStart( record );
			const text = getTextContent( record );
			const characterBefore = text.slice( start - 1, start );

			if ( ! /\s/.test( characterBefore ) ) {
				return record;
			}

			const trimmedTextBefore = text.slice( 0, start ).trim();
			const transformation = findTransform( prefixTransforms, ( { prefix } ) => {
				return trimmedTextBefore === prefix;
			} );

			if ( ! transformation ) {
				return record;
			}

			const content = valueToFormat( slice( record, start, text.length ) );
			const block = transformation.transform( content );

			onCreateUndoLevel();
			onReplace( [ block ] );

			return record;
		},
		( record ) => {
			const text = getTextContent( record );

			// Quick check the text for the necessary character.
			if ( text.indexOf( '`' ) === -1 ) {
				return record;
			}

			const match = text.match( /`([^`]+)`/ );

			if ( ! match ) {
				return record;
			}

			const start = match.index;
			const end = start + match[ 1 ].length;

			record = remove( record, start, start + 1 );
			record = remove( record, end, end + 1 );
			record = applyFormat( record, { type: 'code' }, start, end );

			return record;
		},
	];
}
