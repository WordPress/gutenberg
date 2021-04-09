/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { removeInvalidHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockType } from '../registration';
import { parseWithGrammar } from '../parser';

function sanitizeBlocks( content, schema ) {
	return parseWithGrammar( content ).map( ( block ) => {
		const { name } = block;
		const blockType = getBlockType( name );
		return {
			...block,
			attributes: mapValues( block.attributes, ( value, key ) => {
				const attributeType = blockType.attributes[ key ];

				if ( attributeType.source === 'html' ) {
					return removeInvalidHTML( value, schema, {
						inline: true,
					} );
				}

				return value;
			} ),
		};
	} );
}

export function codeHandler( { HTML = '' }, schema ) {
	return sanitizeBlocks( HTML, schema );
}
