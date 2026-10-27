import { select } from '@wordpress/data';
import { store as richTextStore } from './store';
import type { FormatType } from './types';

/**
 * Returns a registered format type.
 *
 * @param {string} name Format name.
 *
 * @return {FormatType|undefined} Format type.
 */
export function getFormatType( name: string ) {
	return select( richTextStore ).getFormatType( name );
}
