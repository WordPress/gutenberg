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
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- `Tooltip` is not yet on the recommended `@wordpress/ui` allow-list; landing as a migration step ahead of the wider rollout.
import { Icon, Link, Stack, Text, Tooltip } from '@wordpress/ui';

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
		<Stack
			direction="column"
			justify="space-between"
			className={ styles.container }
		>
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
			{ hasSelectedLocation && (
				<EventsListSection
					events={ events }
					loading={ eventsLoading }
					error={ eventsError }
					showEmptyState
				/>
			) }
			<div className={ styles.footer }>
				<Stack direction="row" align="center" gap="sm" wrap="wrap">
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

					{ locationLabel && (
						<div className={ styles.footerLocation }>
							<Tooltip.Root>
								<Tooltip.Trigger
									aria-label={ __( 'Change from settings.' ) }
									render={
										<Stack
											direction="row"
											align="center"
											gap="xs"
										>
											<Icon
												icon={ mapMarker }
												size={ 16 }
											/>
											<Text
												variant="body-sm"
												className={
													styles.locationSummary
												}
											>
												{ locationLabel }
											</Text>
										</Stack>
									}
								/>
								<Tooltip.Popup>
									{ __( 'Change from settings.' ) }
								</Tooltip.Popup>
							</Tooltip.Root>
						</div>
					) }
				</Stack>
			</div>
		</Stack>
	);
}
