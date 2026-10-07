import { screen } from '@testing-library/react';

export const monthNameFormatter = ( localeCode: string, timeZone?: string ) =>
	new Intl.DateTimeFormat( localeCode, {
		calendar: 'gregory',
		year: 'numeric',
		month: 'long',
		timeZone,
	} );

export const fullDateFormatter = ( localeCode: string, timeZone?: string ) =>
	new Intl.DateTimeFormat( localeCode, {
		calendar: 'gregory',
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone,
	} );

export const dateNumberFormatter = ( localeCode: string, timeZone?: string ) =>
	new Intl.DateTimeFormat( localeCode, {
		calendar: 'gregory',
		day: 'numeric',
		timeZone,
	} );

export const weekdayFormatter = ( localeCode: string, timeZone?: string ) =>
	new Intl.DateTimeFormat( localeCode, {
		calendar: 'gregory',
		weekday: 'long',
		timeZone,
	} );

export const getDateButton = (
	date: Date,
	options?: Parameters< typeof screen.getByRole >[ 1 ],
	locale = 'en-US'
) =>
	screen.getByRole( 'button', {
		name: new RegExp( fullDateFormatter( locale ).format( date ) ),
		...options,
	} );

export const getDateCell = (
	date: Date,
	options?: Parameters< typeof screen.getByRole >[ 1 ],
	locale = 'en-US'
) =>
	screen.getByRole( 'gridcell', {
		name: dateNumberFormatter( locale ).format( date ),
		...options,
	} );

export const queryDateCell = (
	date: Date,
	options?: Parameters< typeof screen.getByRole >[ 1 ],
	locale = 'en-US'
) =>
	screen.queryByRole( 'gridcell', {
		name: dateNumberFormatter( locale ).format( date ),
		...options,
	} );
