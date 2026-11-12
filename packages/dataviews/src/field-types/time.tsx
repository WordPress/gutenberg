import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { FormatTime, NormalizedField, SortDirection } from '../types';
import type { FieldType } from '../types/private';
import isValidElements from './utils/is-valid-elements';
import {
	OPERATOR_ON,
	OPERATOR_NOT_ON,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_BETWEEN,
} from '../constants';
import isValidRequired from './utils/is-valid-required';
import { isValidMaxTime, isValidMinTime } from './utils/is-valid-boundary';
import parseTime from './utils/parse-time';
import render from './utils/render-default';

const format = {
	time: getSettings().formats.time,
};

// A time carries no date, so it has to be anchored to one to be formatted. The
// anchor is both parsed and rendered in the site timezone, so the two
// conversions cancel out and the wall clock survives regardless of the
// visitor's own timezone. It is a fixed day rather than today so that a DST
// transition can never shift the result.
const ANCHOR_DATE = '2000-01-01';

function toAnchoredDate( secondsSinceMidnight: number ): Date {
	const hours = Math.floor( secondsSinceMidnight / 3600 );
	const minutes = Math.floor( ( secondsSinceMidnight % 3600 ) / 60 );
	const seconds = secondsSinceMidnight % 60;
	const time = [ hours, minutes, seconds ]
		.map( ( part ) => String( part ).padStart( 2, '0' ) )
		.join( ':' );

	return getDate( `${ ANCHOR_DATE }T${ time }` );
}

function getValueFormatted< Item >( {
	item,
	field,
}: {
	item: Item;
	field: NormalizedField< Item >;
} ): string {
	const secondsSinceMidnight = parseTime( field.getValue( { item } ) );
	if ( secondsSinceMidnight === null ) {
		return '';
	}

	let formatTime: Required< FormatTime >;
	if ( field.type !== 'time' ) {
		formatTime = format;
	} else {
		formatTime = field.format as Required< FormatTime >;
	}

	return dateI18n( formatTime.time, toAnchoredDate( secondsSinceMidnight ) );
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	// Unparseable values sort last in both directions.
	const timeA = parseTime( a );
	const timeB = parseTime( b );
	if ( timeA === null || timeB === null ) {
		if ( timeA === timeB ) {
			return 0;
		}
		return timeA === null ? 1 : -1;
	}

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
};

export default {
	type: 'time',
	render,
	Edit: 'time',
	sort,
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_BETWEEN,
	],
	validOperators: [
		OPERATOR_ON,
		OPERATOR_NOT_ON,
		OPERATOR_BEFORE,
		OPERATOR_AFTER,
		OPERATOR_BEFORE_INC,
		OPERATOR_AFTER_INC,
		OPERATOR_BETWEEN,
	],
	format,
	getValueFormatted,
	validate: {
		required: isValidRequired,
		elements: isValidElements,
		min: isValidMinTime,
		max: isValidMaxTime,
	},
} satisfies FieldType< any >;
