import { DayPicker } from '@daypicker/react';
import { enUS } from '@daypicker/react/locale';
import { forwardRef, useCallback, useMemo } from '@wordpress/element';
import { COMMON_PROPS } from './utils/constants';
import { clampNumberOfMonths } from './utils/misc';
import { useControlledValue } from './utils/use-controlled-value';
import { useLocalizationProps } from './utils/use-localization-props';
import { usePreserveDayFocus } from './utils/use-preserve-day-focus';
import { RootContext } from './utils/root-context';
import type { CalendarProps, OnValueChangeHandler } from './types';

/**
 * `Calendar` provides a customizable calendar interface for **single date**
 * selection.
 *
 * The component is built with accessibility in mind and follows ARIA best
 * practices for calendar widgets. It provides keyboard navigation, screen reader
 * support, and customizable labels for internationalization.
 */
export const Calendar = forwardRef< HTMLDivElement, CalendarProps >(
	function Calendar(
		{
			defaultValue,
			value: valueProp,
			onValueChange,
			numberOfMonths = 1,
			locale = enUS,
			timeZone,
			month,
			render,
			labels: customLabels,
			...props
		},
		ref
	) {
		const localizationProps = useLocalizationProps( {
			locale,
			timeZone,
			mode: 'single',
		} );

		const labels = useMemo(
			() =>
				customLabels
					? { ...localizationProps.labels, ...customLabels }
					: localizationProps.labels,
			[ localizationProps.labels, customLabels ]
		);

		const onChange: OnValueChangeHandler< Date | null | undefined > =
			useCallback(
				( selected, triggerDate, modifiers, e ) => {
					onValueChange?.(
						selected ?? null,
						triggerDate,
						modifiers,
						e
					);
				},
				[ onValueChange ]
			);

		const [ selected, setSelected ] = useControlledValue<
			Date | null | undefined
		>( {
			defaultValue,
			value: valueProp,
			onChange,
		} );
		const dayFocusProps = usePreserveDayFocus( ref, month );

		const rootContextValue = useMemo(
			() => ( { render, ref: dayFocusProps.ref } ),
			[ render, dayFocusProps.ref ]
		);

		return (
			<RootContext.Provider value={ rootContextValue }>
				<DayPicker
					{ ...COMMON_PROPS }
					{ ...localizationProps }
					{ ...props }
					role="application"
					mode="single"
					month={ month }
					numberOfMonths={ clampNumberOfMonths( numberOfMonths ) }
					labels={ labels }
					selected={ selected ?? undefined }
					onSelect={ setSelected }
					onDayFocus={ dayFocusProps.onDayFocus }
					onDayBlur={ dayFocusProps.onDayBlur }
				/>
			</RootContext.Provider>
		);
	}
);
