/**
 * External dependencies
 */
import { DayPicker } from 'react-day-picker';
import { enUS } from 'react-day-picker/locale';
/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { COMMON_PROPS } from '../utils/constants';
import { clampNumberOfMonths } from '../utils/misc';
import { useControlledValue } from '../../utils/hooks';
import { useLocalizationProps } from '../utils/use-localization-props';
import type { DateCalendarProps, OnSelectHandler } from '../types';

/**
 * `DateCalendar` is a React component that provides a customizable calendar
 * interface for **single date** selection.
 *
 * The component is built with accessibility in mind and follows ARIA best
 * practices for calendar widgets. It provides keyboard navigation, screen reader
 * support, and customizable labels for internationalization.
 */
export const DateCalendar = ( {
	defaultSelected,
	selected: selectedProp,
	onSelect,
	numberOfMonths = 1,
	locale = enUS,
	timeZone,
	...props
}: DateCalendarProps ) => {
	const localizationProps = useLocalizationProps( {
		locale,
		timeZone,
		mode: 'single',
	} );

	const onChange: OnSelectHandler< typeof selectedProp > = useCallback(
		( selected, triggerDate, modifiers, e ) => {
			// Convert internal `null` to `undefined` for the public event handler.
			onSelect?.( selected ?? undefined, triggerDate, modifiers, e );
		},
		[ onSelect ]
	);

	const [ selected, setSelected ] = useControlledValue< typeof selectedProp >(
		{
			defaultValue: defaultSelected,
			value: selectedProp,
			onChange,
		}
	);

	return (
		<DayPicker
			{ ...COMMON_PROPS }
			{ ...localizationProps }
			{ ...props }
			mode="single"
			numberOfMonths={ clampNumberOfMonths( numberOfMonths ) }
			selected={ selected ?? undefined }
			onSelect={ setSelected }
		/>
	);
};
