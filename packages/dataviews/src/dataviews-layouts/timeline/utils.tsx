/**
 * WordPress dependencies
 */
import { dateI18n, getSettings, getDate } from '@wordpress/date';

export function generateItemWrapperCompositeId( idPrefix: string ) {
	return `${ idPrefix }-item-wrapper`;
}

export function generatePrimaryActionCompositeId(
	idPrefix: string,
	primaryActionId: string
) {
	return `${ idPrefix }-primary-action-${ primaryActionId }`;
}

export function generateDropdownTriggerCompositeId( idPrefix: string ) {
	return `${ idPrefix }-dropdown`;
}

export function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

export const getFormattedDate = ( dateToDisplay: string | null ) =>
	dateI18n( getSettings().formats.date, getDate( dateToDisplay ) );
