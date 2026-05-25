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
import { __, sprintf } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
import { Spinner } from '@wordpress/components';
import {
	Autocomplete,
	Button,
	Card,
	IconButton,
	InputControl,
	InputLayout,
	Link,
	Stack,
	Text,
} from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { EventsList, type WPEvent } from './components';

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

	return (
		<>
			<EventsList events={ events } showEmptyState={ showEmptyState } />
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
			<EventsListSection
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
