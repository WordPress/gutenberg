/**
 * WordPress dependencies
 */
import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { dateI18n, format } from '@wordpress/date';
import {
	createInterpolateElement,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { calendar, people, wordpress } from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './events-list.module.css';

export interface WPEvent {
	type: 'wordcamp' | 'meetup' | 'online' | string;
	title: string;
	url: string;
	date: string;
	start_unix_timestamp?: number;
	end_unix_timestamp?: number;
	location: {
		description: string;
		country: string;
	};
	user_formatted_date: string;
	user_formatted_time?: string;
	timeZoneAbbreviation?: string;
}

type EventListItem = {
	id: string;
	title: string;
	url: string;
	type: string;
	description: string;
	iconType: 'wordcamp' | 'default';
};

const DEFAULT_LAYOUTS = { list: {} };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: 5,
	search: '',
	filters: [],
	fields: [],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'icon',
	showMedia: true,
	layout: { density: 'compact' },
};

function formatEventType( type: string ): string {
	if ( type === 'wordcamp' ) {
		return 'WordCamp';
	}
	if ( type === 'meetup' ) {
		return __( 'Meetup' );
	}
	return type.charAt( 0 ).toUpperCase() + type.slice( 1 );
}

function getFlippedTimeZoneOffset( startTimestamp: number ): number {
	return new Date( startTimestamp ).getTimezoneOffset() * -1;
}

function getTimeZone( startTimestamp: number ): string | number {
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	if ( typeof timeZone === 'undefined' ) {
		return getFlippedTimeZoneOffset( startTimestamp );
	}

	return timeZone;
}

function getFormattedDate(
	startDate: number,
	endDate?: number,
	timeZone?: string | number
): string {
	let formattedDate: string;

	/* translators: Date format for upcoming events on the dashboard. Include the day of the week. See https://www.php.net/manual/datetime.format.php */
	const singleDayEvent = __( 'l, M j, Y' );
	/* translators: Date string for upcoming events. 1: Month, 2: Starting day, 3: Ending day, 4: Year. */
	const multipleDayEvent = __( '%1$s %2$d–%3$d, %4$d' );
	/* translators: Date string for upcoming events. 1: Starting month, 2: Starting day, 3: Ending month, 4: Ending day, 5: Ending year. */
	const multipleMonthEvent = __( '%1$s %2$d – %3$s %4$d, %5$d' );

	if (
		! endDate ||
		format( 'Y-m-d', startDate ) === format( 'Y-m-d', endDate )
	) {
		formattedDate = dateI18n( singleDayEvent, startDate, timeZone );
	} else if ( format( 'Y-m', startDate ) === format( 'Y-m', endDate ) ) {
		formattedDate = sprintf(
			multipleDayEvent,
			dateI18n(
				_x( 'F', 'upcoming events month format' ),
				startDate,
				timeZone
			),
			Number(
				dateI18n(
					_x( 'j', 'upcoming events day format' ),
					startDate,
					timeZone
				)
			),
			Number(
				dateI18n(
					_x( 'j', 'upcoming events day format' ),
					endDate,
					timeZone
				)
			),
			Number(
				dateI18n(
					_x( 'Y', 'upcoming events year format' ),
					endDate,
					timeZone
				)
			)
		);
	} else {
		formattedDate = sprintf(
			multipleMonthEvent,
			dateI18n(
				_x( 'F', 'upcoming events month format' ),
				startDate,
				timeZone
			),
			Number(
				dateI18n(
					_x( 'j', 'upcoming events day format' ),
					startDate,
					timeZone
				)
			),
			dateI18n(
				_x( 'F', 'upcoming events month format' ),
				endDate,
				timeZone
			),
			Number(
				dateI18n(
					_x( 'j', 'upcoming events day format' ),
					endDate,
					timeZone
				)
			),
			Number(
				dateI18n(
					_x( 'Y', 'upcoming events year format' ),
					endDate,
					timeZone
				)
			)
		);
	}

	return formattedDate;
}

function toEventListItem( event: WPEvent ): EventListItem {
	const startDate = event.start_unix_timestamp
		? event.start_unix_timestamp * 1000
		: Date.parse( event.date );
	const endDate = event.end_unix_timestamp
		? event.end_unix_timestamp * 1000
		: undefined;
	const timeZone = getTimeZone( startDate );
	const formattedDate = Number.isNaN( startDate )
		? event.user_formatted_date || dateI18n( 'M j, Y', event.date )
		: getFormattedDate( startDate, endDate, timeZone );

	const meta = [
		event.type !== 'online' ? formatEventType( event.type ) : null,
		event.location.description,
		formattedDate,
		event.user_formatted_time,
	].filter( Boolean ) as string[];

	return {
		id: event.url,
		title: event.title,
		url: event.url,
		type: event.type,
		description: meta.join( ' · ' ),
		iconType: event.type === 'wordcamp' ? 'wordcamp' : 'default',
	};
}

/* Event type icon in the list layout media slot (no image URL). */
function EventIcon( { item }: { item: EventListItem } ) {
	return (
		<Stack
			className={ styles.eventIcon }
			direction="column"
			align="center"
			justify="center"
		>
			<Icon icon={ item.iconType === 'wordcamp' ? wordpress : people } />
		</Stack>
	);
}

function EventTitle( { item }: { item: EventListItem } ) {
	return (
		<Link href={ item.url } openInNewTab className={ styles.titleLink }>
			{ item.title }
		</Link>
	);
}

function EventMeta( { item }: { item: EventListItem } ) {
	return (
		<Text variant="body-sm" className={ styles.meta }>
			{ item.description }
		</Text>
	);
}

export function EventsList( {
	events,
	showEmptyState,
	location,
	isLoading = false,
}: {
	events: WPEvent[];
	showEmptyState: boolean;
	location?: string;
	isLoading?: boolean;
} ) {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );

	const items = useMemo( () => events.map( toEventListItem ), [ events ] );

	const fields = useMemo< Field< EventListItem >[] >(
		() => [
			{
				id: 'title',
				label: __( 'Title' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <EventTitle item={ item } />,
			},
			{
				id: 'description',
				label: __( 'Details' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <EventMeta item={ item } />,
			},
			{
				id: 'icon',
				label: __( 'Type' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <EventIcon item={ item } />,
			},
		],
		[]
	);

	const organizeUrl = __(
		'https://make.wordpress.org/community/organize-event-landing-page/'
	);
	const locationLabel = location?.trim();
	const emptyTitle = () => {
		if ( locationLabel ) {
			/* translators: %s: selected location label. */
			return sprintf( __( 'No events near %s' ), locationLabel );
		}
		return __( 'No events near you' );
	};

	const empty = showEmptyState ? (
		<Stack align="center" justify="center" className={ styles.emptyState }>
			<EmptyState.Root>
				<EmptyState.Icon icon={ calendar } />
				<EmptyState.Title>{ emptyTitle() }</EmptyState.Title>
				<EmptyState.Description>
					{ createInterpolateElement(
						__( '<a>Help organize the next one!</a>' ),
						{
							a: <Link href={ organizeUrl } openInNewTab />,
						}
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		</Stack>
	) : undefined;

	return (
		<Stack className={ styles.root } direction="column">
			<Stack className={ styles.listArea } direction="column">
				<DataViews
					data={ items }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					getItemId={ ( item ) => item.id }
					isLoading={ isLoading }
					paginationInfo={ {
						totalItems: items.length,
						totalPages: 1,
					} }
					defaultLayouts={ DEFAULT_LAYOUTS }
					empty={ empty }
				>
					<DataViews.Layout />
				</DataViews>
			</Stack>
			{ events.length > 0 && events.length <= 2 && (
				<Text variant="body-sm" className={ styles.eventNone }>
					{ createInterpolateElement(
						__(
							'Want more events? <a>Help organize the next one!</a>'
						),
						{
							a: <Link href={ organizeUrl } openInNewTab />,
						}
					) }
				</Text>
			) }
		</Stack>
	);
}
