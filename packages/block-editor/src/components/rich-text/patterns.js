/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import {
	remove,
	applyFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text';

export function getPatterns( { onReplace, valueToFormat } ) {
	const prefixTransforms = getBlockTransforms( 'from' )
		.filter( ( { type } ) => type === 'prefix' );

	return [
		( record ) => {
			if ( ! onReplace ) {
				return record;
			}

			const { start } = record;
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

			onReplace( [ block ] );

			return record;
		},
		( record ) => {
			const BACKTICK = '`';
			const { start } = record;
			const text = getTextContent( record );
			const characterBefore = text.slice( start - 1, start );

			// Quick check the text for the necessary character.
			if ( characterBefore !== BACKTICK ) {
				return record;
			}

			const textBefore = text.slice( 0, start - 1 );
			const indexBefore = textBefore.lastIndexOf( BACKTICK );

			if ( indexBefore === -1 ) {
				return record;
			}

			const startIndex = indexBefore;
			const endIndex = start - 2;

			if ( startIndex === endIndex ) {
				return record;
			}

			record = remove( record, startIndex, startIndex + 1 );
			record = remove( record, endIndex, endIndex + 1 );
			record = applyFormat( record, { type: 'code' }, startIndex, endIndex );

			return record;
		},
	];
}
