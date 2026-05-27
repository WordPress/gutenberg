/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	EventsList,
	LocationPicker,
	type EventsWidgetAttributes,
	type WPEvent,
} from './components';
import styles from './style.module.css';

interface WPEventsResponse {
	events: WPEvent[];
	location?: {
		description: string;
	};
}

const EVENTS_API = 'https://api.wordpress.org/events/1.0/';

function EventsListSection( {
	events,
	loading,
	error,
	showEmptyState,
}: {
	events: WPEvent[];
	loading: boolean;
	error: boolean;
	showEmptyState: boolean;
} ) {
	if ( error ) {
		return (
			<p className={ styles.statusText }>
				{ __( 'An error occurred. Please try again.' ) }
			</p>
		);
	}

	const organizeUrl = __(
		'https://make.wordpress.org/community/organize-event-landing-page/'
	);

	return (
		<>
			<EventsList
				events={ events }
				showEmptyState={ showEmptyState }
				isLoading={ loading }
			/>
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
		</>
	);
}

export default function WordPressEvents( {
	attributes = {},
	setAttributes,
}: {
	attributes?: EventsWidgetAttributes;
	setAttributes?: ( next: Partial< EventsWidgetAttributes > ) => void;
} ) {
	const userLocale = useSelect(
		( select ) =>
			( ( select( coreStore ) as any ).getCurrentUser()
				?.locale as string ) ?? 'en_US',
		[]
	);

	const persistedLocation =
		typeof attributes.location === 'string'
			? attributes.location.trim()
			: '';

	const [ activeLocation, setActiveLocation ] = useState( persistedLocation );
	const [ locationLabel, setLocationLabel ] = useState( '' );

	useEffect( () => {
		setActiveLocation( persistedLocation );
	}, [ persistedLocation ] );
	const [ events, setEvents ] = useState< WPEvent[] >( [] );
	const [ eventsLoading, setEventsLoading ] = useState( false );
	const [ eventsError, setEventsError ] = useState( false );

	const hasSelectedLocation = Boolean( activeLocation.trim() );

	useEffect( () => {
		if ( ! hasSelectedLocation ) {
			return;
		}

		const controller = new AbortController();
		setEventsLoading( true );
		setEventsError( false );

		const params = new URLSearchParams( {
			number: '5',
			locale: userLocale,
			location: activeLocation,
		} );

		fetch( `${ EVENTS_API }?${ params }`, { signal: controller.signal } )
			.then( ( r ) => r.json() as Promise< WPEventsResponse > )
			.then( ( data ) => {
				setEvents( data.events ?? [] );
				if ( data.location?.description ) {
					setLocationLabel( data.location.description );
				}
				setEventsLoading( false );
			} )
			.catch( ( err: Error ) => {
				if ( err.name !== 'AbortError' ) {
					setEventsError( true );
					setEventsLoading( false );
				}
			} );

		return () => controller.abort();
	}, [ activeLocation, hasSelectedLocation, userLocale ] );

	return (
		<>
			{ ! locationLabel && (
				<Stack
					className={ styles.locationPickerInWidget }
					direction="column"
					align="center"
					justify="center"
				>
					<LocationPicker
						onSubmit={ ( location ) => {
							const next = location.trim();
							setActiveLocation( next );
							setAttributes?.( { location: next } );
						} }
						seedInput={ activeLocation }
						hideLabelFromVision
					/>
				</Stack>
			) }
			{ locationLabel && (
				<div className={ styles.locationSummary }>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: location name */
							__( 'Upcoming events near <strong>%s</strong>.' ),
							locationLabel
						),
						{
							strong: <strong />,
						}
					) }
				</div>
			) }
			{ hasSelectedLocation && (
				<EventsListSection
					events={ events }
					loading={ eventsLoading }
					error={ eventsError }
					showEmptyState
				/>
			) }
			<div className={ styles.footer }>
				<Stack direction="row" align="center" gap="sm">
					<Link
						href="https://make.wordpress.org/community/meetups-landing-page"
						openInNewTab
					>
						{ __( 'Meetups' ) }
					</Link>
					<Link
						href="https://central.wordcamp.org/schedule/"
						openInNewTab
					>
						{ __( 'WordCamps' ) }
					</Link>
				</Stack>
			</div>
		</>
	);
}
