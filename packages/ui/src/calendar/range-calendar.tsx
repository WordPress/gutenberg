import { differenceInCalendarDays } from 'date-fns';
import { DayPicker, rangeContainsModifiers } from '@daypicker/react';
import { forwardRef, useMemo, useState, useCallback } from '@wordpress/element';
import { COMMON_PROPS, MODIFIER_CLASSNAMES } from './utils/constants';
import { clampNumberOfMonths } from './utils/misc';
import { useControlledValue } from './utils/use-controlled-value';
import { useLocalizationProps } from './utils/use-localization-props';
import { usePreserveDayFocus } from './utils/use-preserve-day-focus';
import { RootContext } from './utils/root-context';
import type {
	RangeCalendarProps,
	DateRange,
	OnValueChangeHandler,
} from './types';

export function usePreviewRange( {
	value,
	hoveredDate,
	excludeDisabled,
	min,
	max,
	disabled,
}: Pick<
	RangeCalendarProps,
	'value' | 'excludeDisabled' | 'min' | 'max' | 'disabled'
> & {
	hoveredDate: Date | undefined;
} ) {
	return useMemo( () => {
		if ( ! hoveredDate || ! value?.from ) {
			return;
		}

		let previewHighlight: DateRange | undefined;
		let potentialNewRange: { from: Date; to: Date } | undefined;

		// Hovering on a date before the start of the selected range
		if ( hoveredDate < value.from ) {
			previewHighlight = {
				from: hoveredDate,
				to: value.from,
			};

			potentialNewRange = {
				from: hoveredDate,
				to: value.to ?? value.from,
			};
		} else if (
			value.to &&
			hoveredDate > value.from &&
			hoveredDate < value.to
		) {
			// Hovering on a date between the start and end of the selected range
			previewHighlight = {
				from: value.from,
				to: hoveredDate,
			};

			potentialNewRange = {
				from: value.from,
				to: hoveredDate,
			};
		} else if ( hoveredDate > value.from ) {
			// Hovering on a date after the end of the selected range (either
			// because it's greater than selected.to, or because it's not defined)
			previewHighlight = {
				from: value.to ?? value.from,
				to: hoveredDate,
			};

			potentialNewRange = {
				from: value.from,
				to: hoveredDate,
			};
		}

		if (
			min !== undefined &&
			min > 0 &&
			potentialNewRange &&
			differenceInCalendarDays(
				potentialNewRange.to,
				potentialNewRange.from
			) < min
		) {
			previewHighlight = {
				from: hoveredDate,
				to: hoveredDate,
			};
		}

		if (
			max !== undefined &&
			max > 0 &&
			potentialNewRange &&
			differenceInCalendarDays(
				potentialNewRange.to,
				potentialNewRange.from
			) > max
		) {
			previewHighlight = {
				from: hoveredDate,
				to: hoveredDate,
			};
		}

		if (
			excludeDisabled &&
			disabled &&
			potentialNewRange &&
			rangeContainsModifiers( potentialNewRange, disabled )
		) {
			previewHighlight = {
				from: hoveredDate,
				to: hoveredDate,
			};
		}

		return previewHighlight;
	}, [ value, hoveredDate, excludeDisabled, min, max, disabled ] );
}

/**
 * `RangeCalendar` provides a customizable calendar interface for **date range**
 * selection.
 *
 * The component is built with accessibility in mind and follows ARIA best
 * practices for calendar widgets. It provides keyboard navigation, screen reader
 * support, and customizable labels for internationalization.
 */
export const RangeCalendar = forwardRef< HTMLDivElement, RangeCalendarProps >(
	function RangeCalendar(
		{
			defaultValue,
			value: valueProp,
			onValueChange,
			numberOfMonths = 1,
			excludeDisabled,
			min,
			max,
			disabled,
			locale,
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
			mode: 'range',
		} );

		const labels = useMemo(
			() =>
				customLabels
					? { ...localizationProps.labels, ...customLabels }
					: localizationProps.labels,
			[ localizationProps.labels, customLabels ]
		);

		const onChange: OnValueChangeHandler< DateRange | null | undefined > =
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
			DateRange | null | undefined
		>( {
			defaultValue,
			value: valueProp,
			onChange,
		} );
		const dayFocusProps = usePreserveDayFocus( ref, month );

		const [ hoveredDate, setHoveredDate ] = useState< Date | undefined >(
			undefined
		);

		// Compute the preview range for hover effect
		const previewRange = usePreviewRange( {
			value: selected,
			hoveredDate,
			excludeDisabled,
			min,
			max,
			disabled,
		} );

		const modifiers = useMemo( () => {
			return {
				preview: previewRange,
				preview_start: previewRange?.from,
				preview_end: previewRange?.to,
			};
		}, [ previewRange ] );

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
					mode="range"
					month={ month }
					numberOfMonths={ clampNumberOfMonths( numberOfMonths ) }
					disabled={ disabled }
					excludeDisabled={ excludeDisabled }
					min={ min }
					max={ max }
					labels={ labels }
					selected={ selected ?? undefined }
					onSelect={ setSelected }
					onDayFocus={ dayFocusProps.onDayFocus }
					onDayBlur={ dayFocusProps.onDayBlur }
					onDayMouseEnter={ ( date ) => setHoveredDate( date ) }
					onDayMouseLeave={ () => setHoveredDate( undefined ) }
					modifiers={ modifiers }
					modifiersClassNames={ MODIFIER_CLASSNAMES }
				/>
			</RootContext.Provider>
		);
	}
);
