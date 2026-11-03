import { endOfMonth, startOfMonth } from 'date-fns';
import { useEffect, useRef, useState } from '@wordpress/element';
import type { CalendarEvent, GetCalendarEvents } from '../../../types';

/**
 * Loads the events to mark on the calendar for the month it displays.
 *
 * Events load again when the displayed month changes, not when the item does:
 * an edit to the item (e.g. typing a new date) shouldn't refetch them.
 *
 * @param getEvents The loader from the control config, if any.
 * @param item      The item being edited.
 * @param month     A date in the displayed month, in the calendar's time zone.
 * @return The events of the displayed month, once loaded.
 */
export default function useCalendarEvents< Item >(
	getEvents: GetCalendarEvents< Item > | undefined,
	item: Item,
	month: Date
): CalendarEvent[] | undefined {
	const [ events, setEvents ] = useState< CalendarEvent[] >();
	// Read by the loading effect, which only reruns when the month changes.
	const latestRef = useRef( { item, month } );
	useEffect( () => {
		latestRef.current = { item, month };
	}, [ item, month ] );

	// `month` can change identity within the same month; its start doesn't.
	const monthStart = startOfMonth( month ).getTime();

	useEffect( () => {
		setEvents( undefined );
		if ( ! getEvents ) {
			return;
		}
		let isCurrent = true;
		// Computed on the calendar's date, so the bounds follow its time zone.
		const from = startOfMonth( latestRef.current.month );
		getEvents( {
			item: latestRef.current.item,
			from,
			to: endOfMonth( from ),
		} ).then(
			( result ) => {
				if ( isCurrent ) {
					setEvents( result );
				}
			},
			() => {
				// The markers are a hint: leave them out if they fail to load.
			}
		);
		return () => {
			isCurrent = false;
		};
	}, [ getEvents, monthStart ] );

	return events;
}
