/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { remove, applyFormat, getTextContent } from '@wordpress/rich-text-value';

export function getPatterns( { onReplace, multiline } ) {
	const patterns = filter( getBlockTransforms( 'from' ), ( { type, trigger } ) => {
		return type === 'pattern' && trigger === undefined;
	} );

	return [
		( record ) => {
			if ( ! onReplace ) {
				return record;
			}

			const text = getTextContent( record );
			const transformation = findTransform( patterns, ( item ) => {
				return item.regExp.test( text );
			} );

			if ( ! transformation ) {
				return record;
			}

			const result = text.match( transformation.regExp );

			const block = transformation.transform( {
				content: remove( record.value, 0, result[ 0 ].length ),
				match: result,
			} );

			onReplace( [ block ] );

			return record;
		},
		( record ) => {
			if ( multiline ) {
				return record;
			}

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
