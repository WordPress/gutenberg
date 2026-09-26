import { isValid as isValidDate } from 'date-fns';
import { getDate } from '@wordpress/date';

export default function parseDateTime( dateTimeString?: string ): Date | null {
	if ( ! dateTimeString ) {
		return null;
	}
	const parsed = getDate( dateTimeString );
	return parsed && isValidDate( parsed ) ? parsed : null;
}
