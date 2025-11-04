/**
 * WordPress dependencies
 */
import { dateI18n, getSettings, getDate } from '@wordpress/date';

export function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

export const getFormattedDate = ( dateToDisplay: string | null ) =>
	dateI18n( getSettings().formats.date, getDate( dateToDisplay ) );
