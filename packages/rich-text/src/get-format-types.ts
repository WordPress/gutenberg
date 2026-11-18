import { select } from '@wordpress/data';
import { store as richTextStore } from './store';

/**
 * Returns all registered formats.
 *
 * @return Format settings.
 */
export function getFormatTypes() {
	return select( richTextStore ).getFormatTypes();
}
