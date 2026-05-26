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
import { EventsList, LocationPicker, type WPEvent } from './components';
import renderStyles from './render.module.css';
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

export default function WordPressEvents() {
	const userLocale = useSelect(
		( select ) =>
			( ( select( coreStore ) as any ).getCurrentUser()
				?.locale as string ) ?? 'en_US',
		[]
	);

	const [ activeLocation, setActiveLocation ] = useState( '' );
	const [ locationLabel, setLocationLabel ] = useState( '' );
	const [ isEditingLocation, setIsEditingLocation ] = useState( false );
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
			<LocationPicker
				hidden={ Boolean( locationLabel ) && ! isEditingLocation }
				onSubmit={ ( location ) => {
					setActiveLocation( location );
					setIsEditingLocation( false );
				} }
				showCancel={ isEditingLocation }
				onCancel={ () => setIsEditingLocation( false ) }
				seedInput={ activeLocation }
			/>
			{ locationLabel && ! isEditingLocation && (
				<div className={ renderStyles.locationSummary }>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: city name */
							__( 'Upcoming events near <strong>%s</strong>.' ),
							locationLabel
						),
						{
							strong: <strong />,
						}
					) }{ ' ' }
					<Link onClick={ () => setIsEditingLocation( true ) }>
						{ __( 'Change' ) }
					</Link>
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
			<div className={ renderStyles.footer }>
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
