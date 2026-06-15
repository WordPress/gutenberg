/**
 * WordPress dependencies
 */
import { cleanForSlug } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getItemTitle } from '../../actions/utils';

export const getSlug = ( item: BasePost ): string => {
	if ( typeof item !== 'object' ) {
		return '';
	}

	return (
		item.slug || cleanForSlug( getItemTitle( item ) ) || item.id.toString()
	);
};
