/**
 * @format
 * @flow
 */

import { serialize } from '@wordpress/blocks';

export function serializeBlocksToHtml( blocks: Array<Object> ): string {
	return blocks
		.map( serializeBlock )
		.join( '' );
}

function serializeBlock( block: Object ): string {
	if ( block.name === 'aztec' ) {
		return '<aztec>' + block.attributes.content + '</aztec>\n\n';
	}

	return serialize( [ block ] ) + '\n\n';
}
