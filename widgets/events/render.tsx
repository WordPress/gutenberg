/**
 * WordPress dependencies
 */
import {
	useId,
	useState,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, format } from '@wordpress/date';
import { __, _x, sprintf } from '@wordpress/i18n';
import { calendar, mapMarker, wordpress, people } from '@wordpress/icons';
import { Spinner } from '@wordpress/components';
/* eslint-disable @wordpress/use-recommended-components */
import {
	Autocomplete,
	Button,
	Card,
	EmptyState,
	Icon,
	IconButton,
	InputControl,
	InputLayout,
	Link,
	Stack,
	Text,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import styles from './style.module.css';
import List, { type ListItem } from './list';

interface WPEvent {
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

interface WPEventsResponse {
	events: WPEvent[];
	location?: {
		description: string;
	};
}

const EVENTS_API = 'https://api.wordpress.org/events/1.0/';
type LocationOption = {
	id: string;
	value: string;
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

function EventsList( {
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
	if ( loading ) {
		return (
			<Stack justify="center" align="center">
				<Spinner />
			</Stack>
		);
	}

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

	const emptyState = (
		<Stack align="center" justify="center" style={ { margin: '24px 0' } }>
			<EmptyState.Root>
				<EmptyState.Icon icon={ calendar } />
				<EmptyState.Title>
					{ __( 'No events near you' ) }
				</EmptyState.Title>
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
	);

	const items: ListItem[] = events.map( ( event ) => {
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

		return {
			id: event.url,
			title: event.title,
			url: event.url,
			icon:
				event.type === 'wordcamp' ? (
					<Icon icon={ wordpress } />
				) : (
					<Icon icon={ people } />
				),
			meta: [
				event.type !== 'online' ? formatEventType( event.type ) : null,
				event.location.description,
				formattedDate,
				event.user_formatted_time,
			].filter( Boolean ) as string[],
		};
	} );

	return (
		<>
			<List
				items={ items }
				empty={ showEmptyState ? emptyState : undefined }
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
	const locationInputId = useId();
	const userLocale = useSelect(
		( select ) =>
			( ( select( coreStore ) as any ).getCurrentUser()
				?.locale as string ) ?? 'en_US',
		[]
	);

	const [ locationInput, setLocationInput ] = useState( '' );
	const [ locationOptions, setLocationOptions ] = useState<
		LocationOption[]
	>( [] );
	const [ activeLocation, setActiveLocation ] = useState( '' );
	const [ locationLabel, setLocationLabel ] = useState( '' );
	const [ isEditingLocation, setIsEditingLocation ] = useState( false );
	const [ isLocatingCity, setIsLocatingCity ] = useState( false );
	const [ events, setEvents ] = useState< WPEvent[] >( [] );
	const [ eventsLoading, setEventsLoading ] = useState( true );
	const [ eventsError, setEventsError ] = useState( false );

	const fillCityFromGeolocation = async () => {
		if ( ! navigator.geolocation || isLocatingCity ) {
			return;
		}

		setIsLocatingCity( true );

		try {
			const position = await new Promise< GeolocationPosition >(
				( resolve, reject ) => {
					navigator.geolocation.getCurrentPosition( resolve, reject, {
						enableHighAccuracy: false,
						timeout: 10000,
					} );
				}
			);

			const { latitude, longitude } = position.coords;
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${ latitude }&lon=${ longitude }`
			);
			const data = ( await response.json() ) as {
				address?: {
					city?: string;
					town?: string;
					village?: string;
					municipality?: string;
				};
			};

			const city =
				data.address?.city ??
				data.address?.town ??
				data.address?.village ??
				data.address?.municipality;

			if ( city ) {
				setLocationInput( city );
			}
		} catch {
			// No-op: keep manual location entry as fallback.
		} finally {
			setIsLocatingCity( false );
		}
	};

	useEffect( () => {
		const query = locationInput.trim();

		if ( query.length < 2 ) {
			setLocationOptions( [] );
			return;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout( async () => {
			try {
				const params = new URLSearchParams( {
					q: query,
					featureType: 'city',
					format: 'jsonv2',
					addressdetails: '1',
					limit: '8',
				} );
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?${ params }`,
					{ signal: controller.signal }
				);
				const data = ( await response.json() ) as Array< {
					place_id: number;
					address?: {
						city?: string;
						town?: string;
						village?: string;
						municipality?: string;
						country?: string;
					};
				} >;

				const seen = new Set< string >();
				const nextOptions = data
					.map( ( place ) => {
						const city =
							place.address?.city ??
							place.address?.town ??
							place.address?.village ??
							place.address?.municipality;
						const country = place.address?.country;

						if ( ! city ) {
							return null;
						}

						const label = country
							? `${ city }, ${ country }`
							: city;
						if ( seen.has( label.toLowerCase() ) ) {
							return null;
						}

						seen.add( label.toLowerCase() );
						return {
							id: String( place.place_id ),
							value: label,
						};
					} )
					.filter( Boolean ) as LocationOption[];

				setLocationOptions( nextOptions );
			} catch ( error: unknown ) {
				if ( error instanceof Error && error.name === 'AbortError' ) {
					return;
				}
				setLocationOptions( [] );
			}
		}, 200 );

		return () => {
			clearTimeout( timeoutId );
			controller.abort();
		};
	}, [ locationInput ] );

	useEffect( () => {
		const controller = new AbortController();
		setEventsLoading( true );
		setEventsError( false );

		const params = new URLSearchParams( {
			number: '5',
			locale: userLocale,
		} );
		if ( activeLocation ) {
			params.set( 'location', activeLocation );
		}

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
	}, [ activeLocation, userLocale ] );

	return (
		<Card.Content>
			{ ! locationLabel || isEditingLocation ? (
				<div className={ styles.locationPicker }>
					<form
						onSubmit={ ( e ) => {
							e.preventDefault();
							setActiveLocation( locationInput );
							setIsEditingLocation( false );
						} }
					>
						<Stack direction="row" align="top" wrap="wrap" gap="sm">
							<Autocomplete.Root
								items={ locationOptions }
								value={ locationInput }
								onValueChange={ setLocationInput }
							>
								<Autocomplete.Input
									id={ locationInputId }
									className={ styles.locationInput }
									render={
										<InputControl
											autoComplete="off"
											label={ __( 'City' ) }
											hideLabelFromVision
											size="compact"
											description={ __(
												'Select a city to view upcoming events.'
											) }
											onValueChange={ () => {} }
											suffix={
												<InputLayout.Slot padding="minimal">
													<Autocomplete.Clear />
													<IconButton
														icon={ mapMarker }
														label={ __(
															'Use current location'
														) }
														onClick={
															fillCityFromGeolocation
														}
														disabled={
															isLocatingCity
														}
														size="small"
														variant="minimal"
													/>
												</InputLayout.Slot>
											}
										/>
									}
									placeholder={ __( 'City, like Tokyo…' ) }
								/>
								{ locationOptions.length > 0 && (
									<Autocomplete.Popup>
										<Autocomplete.List>
											<Autocomplete.ListBody>
												<Autocomplete.Collection>
													{ ( item: {
														id: string;
														value: string;
													} ) => (
														<Autocomplete.Item
															key={ item.id }
															value={ item }
														>
															{ item.value }
														</Autocomplete.Item>
													) }
												</Autocomplete.Collection>
											</Autocomplete.ListBody>
										</Autocomplete.List>
									</Autocomplete.Popup>
								) }
							</Autocomplete.Root>
							<Button
								variant="outline"
								size="compact"
								type="submit"
								disabled={ ! locationInput.trim() }
							>
								{ __( 'Select' ) }
							</Button>
							{ isEditingLocation && (
								<Button
									size="compact"
									tone="neutral"
									variant="minimal"
									onClick={ () =>
										setIsEditingLocation( false )
									}
								>
									{ __( 'Cancel' ) }
								</Button>
							) }
						</Stack>
					</form>
				</div>
			) : null }
			<EventsList
				events={ events }
				loading={ eventsLoading }
				error={ eventsError }
				showEmptyState={ Boolean( activeLocation.trim() ) }
			/>
			<Stack
				align="center"
				className={ styles.footer }
				direction="row"
				gap="md"
				justify="space-between"
				wrap="wrap"
			>
				{ locationLabel && ! isEditingLocation && (
					<div>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: city name */
								__(
									'Upcoming events near <strong>%s</strong>.'
								),
								locationLabel
							),
							{
								strong: <strong />,
							}
						) }{ ' ' }
						<Link
							onClick={ () => {
								setLocationInput( activeLocation );
								setIsEditingLocation( true );
							} }
						>
							{ __( 'Change' ) }
						</Link>
					</div>
				) }
				<Stack
					direction="row"
					align="center"
					gap="sm"
					className={ styles.footerLinks }
				>
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
			</Stack>
		</Card.Content>
	);
}
