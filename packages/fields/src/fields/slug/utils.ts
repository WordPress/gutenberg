import { cleanForSlug } from '@wordpress/url';
import type { BasePost } from '../../types';
import { getItemTitle } from '../utils';

export const getSlug = ( item: BasePost ): string => {
	if ( typeof item !== 'object' ) {
		return '';
	}

	// An auto-draft's generated slug comes from the `Auto Draft` placeholder
	// title and isn't refreshed by autosaves, so fall back to the title.
	const generatedSlug =
		item.status !== 'auto-draft' ? item.generated_slug : undefined;

	return (
		item.slug ||
		generatedSlug ||
		cleanForSlug( getItemTitle( item ) ) ||
		item.id.toString()
	);
};
