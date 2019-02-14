/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/**
 * Normalises formats: ensures subsequent equal formats have the same reference.
 *
 * @param  {Object} value Value to normalise formats of.
 *
 * @return {Object} New value with normalised formats.
 */
export function normaliseFormats( { formats, text, start, end } ) {
	const refs = [];
	const newFormats = formats.map( ( formatsAtIndex ) =>
		formatsAtIndex.map( ( format ) => {
			const equalRef = find( refs, ( ref ) =>
				isFormatEqual( ref, format )
			);

			if ( equalRef ) {
				return equalRef;
			}

			refs.push( format );

			return format;
		} )
	);

	return { formats: newFormats, text, start, end };
}
