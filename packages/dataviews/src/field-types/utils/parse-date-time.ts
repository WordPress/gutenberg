/**
 * WordPress dependencies
 */
import { getDate } from '@wordpress/date';

export default function parseDateTime( dateTimeString?: string ): Date | null {
	if ( ! dateTimeString ) {
		return null;
	}
	const parsed = getDate( dateTimeString );
	return parsed && ! isNaN( parsed.valueOf() ) ? parsed : null;
}
