/**
 * External dependencies
 */

import { find } from 'lodash';

export function getActiveFormat( { formats, start }, formatType ) {
	if ( start === undefined ) {
		return;
	}

	return find( formats[ start ], { type: formatType } );
}
