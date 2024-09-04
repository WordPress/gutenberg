/**
 * External dependencies
 */
import type { KeyboardEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DayButton } from './styles';

type DayProps = {
	day: Date;
	column: number;
	isSelected: boolean;
	isFocusable: boolean;
	isFocusAllowed: boolean;
	isToday: boolean;
	numEvents: number;
	isInvalid: boolean;
	onClick: () => void;
	onKeyDown: KeyboardEventHandler;
};

function Day( {
	day,
	column,
	isSelected,
	isFocusable,
	isFocusAllowed,
	isToday,
	isInvalid,
	numEvents,
	onClick,
	onKeyDown,
}: DayProps ) {
	const ref = useRef< HTMLButtonElement >();

	// Focus the day when it becomes focusable, e.g. because an arrow key is
	// pressed. Only do this if focus is allowed - this stops us stealing focus
	// from e.g. a TimePicker input.
	useEffect( () => {
		if ( ref.current && isFocusable && isFocusAllowed ) {
			ref.current.focus();
		}
		// isFocusAllowed is not a dep as there is no point calling focus() on
		// an already focused element.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isFocusable ] );

	return (
		<DayButton
			ref={ ref }
			className="components-datetime__date__day" // Unused, for backwards compatibility.
			disabled={ isInvalid }
			tabIndex={ isFocusable ? 0 : -1 }
			aria-label={ getDayLabel( day, isSelected, numEvents ) }
			column={ column }
			isSelected={ isSelected }
			isToday={ isToday }
			hasEvents={ numEvents > 0 }
			onClick={ onClick }
			onKeyDown={ onKeyDown }
		>
			{ dateI18n( 'j', day, -day.getTimezoneOffset() ) }
		</DayButton>
	);
}

function getDayLabel( date: Date, isSelected: boolean, numEvents: number ) {
	const { formats } = getSettings();
	const localizedDate = dateI18n(
		formats.date,
		date,
		-date.getTimezoneOffset()
	);
	if ( isSelected && numEvents > 0 ) {
		return sprintf(
			// translators: 1: The calendar date. 2: Number of events on the calendar date.
			_n(
				'%1$s. Selected. There is %2$d event',
				'%1$s. Selected. There are %2$d events',
				numEvents
			),
			localizedDate,
			numEvents
		);
	} else if ( isSelected ) {
		return sprintf(
			// translators: %s: The calendar date.
			__( '%1$s. Selected' ),
			localizedDate
		);
	} else if ( numEvents > 0 ) {
		return sprintf(
			// translators: 1: The calendar date. 2: Number of events on the calendar date.
			_n(
				'%1$s. There is %2$d event',
				'%1$s. There are %2$d events',
				numEvents
			),
			localizedDate,
			numEvents
		);
	}
	return localizedDate;
}

export default Day;
