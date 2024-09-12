/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import type { Post } from '../types';

export function getItemTitle( item: Post ) {
	if ( typeof item.title === 'string' ) {
		return decodeEntities( item.title );
	}
	if ( 'rendered' in item.title ) {
		return decodeEntities( item.title.rendered );
	}
	if ( 'raw' in item.title ) {
		return decodeEntities( item.title.raw );
	}
	return '';
}
