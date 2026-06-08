/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getItemTitleWithFallbackSnippet } from '../../actions/utils';

export function getTitleWithFallbackName( post: BasePost ) {
	return getItemTitleWithFallbackSnippet( post );
}
