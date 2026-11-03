import { isSameDay } from 'date-fns';
import { useMemo } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import type { BaseProps, Modifiers } from '../types';

type Labels = NonNullable< BaseProps[ 'labels' ] >;

/**
 * Marks the days that have events and announces how many each one has.
 *
 * Days are compared with the day as the first argument, so `date-fns` reads
 * the event date in the calendar's time zone when the day is a `TZDate`.
 *
 * @param events The events to mark.
 * @param labels The calendar labels to extend.
 * @return The `events` matcher, if any, and the extended labels.
 */
export function useEvents(
	events: BaseProps[ 'events' ],
	labels: Labels
): { eventsMatcher?: ( day: Date ) => boolean; labels: Labels } {
	return useMemo( () => {
		if ( ! events?.length ) {
			return { labels };
		}

		const countEvents = ( day: Date ) =>
			events.filter( ( event ) => isSameDay( day, event.date ) ).length;

		const withEvents =
			( label?: ( date: Date, modifiers?: Modifiers ) => string ) =>
			( date: Date, modifiers?: Modifiers ) => {
				const baseLabel = label?.( date, modifiers ) ?? '';
				const count = modifiers?.events ? countEvents( date ) : 0;
				if ( ! count ) {
					return baseLabel;
				}
				return sprintf(
					// translators: 1: The label of the day (e.g. "Monday, April 29, 2025"). 2: Number of events on that day.
					_n( '%1$s, %2$d event', '%1$s, %2$d events', count ),
					baseLabel,
					count
				);
			};

		return {
			eventsMatcher: ( day: Date ) =>
				events.some( ( event ) => isSameDay( day, event.date ) ),
			labels: {
				...labels,
				labelDayButton: withEvents( labels.labelDayButton ),
				labelGridcell: withEvents( labels.labelGridcell ),
			},
		};
	}, [ events, labels ] );
}
