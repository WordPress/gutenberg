/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import { default as inlineImage } from './inline-image';

export function getInlineBlocks() {
	return [ inlineImage ];
}

export function getInlineBlock( id ) {
	const inlineBlocks = getInlineBlocks();

	return find( inlineBlocks, { id } );
}

