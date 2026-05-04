/**
 * WordPress dependencies
 */
import {
	useId,
	useState,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews';
import type { View, Field } from '@wordpress/dataviews';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, EmptyState, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPEvent {
	type: 'wordcamp' | 'meetup' | 'online' | string;
	title: string;
	url: string;
	date: string;
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

interface NewsPost {
	id: number;
	title: { rendered: string };
	link: string;
	date: string;
}

interface NewsFeed {
	label: string;
	siteUrl: string;
	posts: NewsPost[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENTS_API = 'https://api.wordpress.org/events/1.0/';

const NEWS_FEEDS = [
	{
		key: 'news',
		/* translators: WordPress.org blog feed label in the Events and News widget. */
		label: __( 'WordPress Blog' ),
		/* translators: If a Rosetta site exists (e.g. https://es.wordpress.org/news/), then use that. Otherwise, leave untranslated. */
		siteUrl: _x(
			'https://wordpress.org/news/',
			'Events and News dashboard widget'
		),
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?per_page=2&_fields=id,title,link,date',
	},
	{
		key: 'planet',
		/* translators: Planet WordPress feed label in the Events and News widget. */
		label: __( 'Other WordPress News' ),
		/* translators: If a localized Planet site exists, use that URL. Otherwise, leave untranslated. */
		siteUrl: _x(
			'https://planet.wordpress.org/',
			'Events and News dashboard widget'
		),
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?per_page=3&_fields=id,title,link,date',
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeEntities( html: string ): string {
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = html;
	return txt.value;
}

function formatEventType( type: string ): string {
	if ( type === 'wordcamp' ) {
		return 'WordCamp';
	}
	if ( type === 'meetup' ) {
		return __( 'Meetup' );
	}
	return type.charAt( 0 ).toUpperCase() + type.slice( 1 );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EVENT_FIELDS: Field< WPEvent >[] = [
	{
		id: 'title',
		label: __( 'Event' ),
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => item.title,
		render: ( { item } ) => (
			<Link href={ item.url } openInNewTab>
				{ item.title }
			</Link>
		),
	},
	{
		id: 'typeLocation',
		label: __( 'Location' ),
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) =>
			[
				item.type !== 'online' ? formatEventType( item.type ) : null,
				item.location.description,
			]
				.filter( Boolean )
				.join( ' \u00B7 ' ),
	},
	{
		id: 'dateTime',
		label: __( 'Date' ),
		type: 'datetime',
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => item.date,
	},
];

const DEFAULT_EVENTS_VIEW: View = {
	type: 'table',
	fields: [ 'title', 'typeLocation', 'dateTime' ],
};

function EventsList( {
	events,
	loading,
	error,
}: {
	events: WPEvent[];
	loading: boolean;
	error: boolean;
} ) {
	const [ view, setView ] = useState< View >( DEFAULT_EVENTS_VIEW );

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
		<EmptyState.Root>
			<EmptyState.Title>{ __( 'No events near you' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ createInterpolateElement(
					/* translators: Anchor tag links to meetup organizer documentation. */
					__( '<a>Help organize the next one</a>!' ),
					{
						a: <Link href={ organizeUrl } />,
					}
				) }
			</EmptyState.Description>
		</EmptyState.Root>
	);

	return (
		<>
			<DataViews
				data={ events }
				fields={ EVENT_FIELDS }
				view={ view }
				onChangeView={ setView }
				getItemId={ ( item ) => item.url }
				defaultLayouts={ { table: true } }
				paginationInfo={ {
					totalItems: events.length,
					totalPages: 1,
				} }
				empty={ emptyState }
			>
				<DataViews.Layout />
			</DataViews>
			{ events.length > 0 && events.length <= 2 && (
				<p className={ styles.eventNone }>
					{ createInterpolateElement(
						/* translators: Anchor tag links to meetup organizer documentation. */
						__(
							'Want more events? <a>Help organize the next one</a>!'
						),
						{
							a: <Link href={ organizeUrl } />,
						}
					) }
				</p>
			) }
		</>
	);
}

const NEWS_FIELDS: Field< NewsPost >[] = [
	{
		id: 'title',
		label: __( 'Post' ),
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => decodeEntities( item.title.rendered ),
		render: ( { item } ) => (
			<Link href={ item.link } openInNewTab>
				{ decodeEntities( item.title.rendered ) }
			</Link>
		),
	},
	{
		id: 'date',
		label: __( 'Date' ),
		type: 'datetime',
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => item.date,
	},
];

const DEFAULT_NEWS_VIEW: View = {
	type: 'table',
	fields: [ 'title', 'date' ],
};

function NewsFeedList( { posts }: { posts: NewsPost[] } ) {
	const [ view, setView ] = useState< View >( DEFAULT_NEWS_VIEW );

	return (
		<DataViews
			data={ posts }
			fields={ NEWS_FIELDS }
			view={ view }
			onChangeView={ setView }
			getItemId={ ( item ) => String( item.id ) }
			defaultLayouts={ { table: true } }
			paginationInfo={ {
				totalItems: posts.length,
				totalPages: 1,
			} }
			empty={
				<EmptyState.Root>
					<EmptyState.Title>
						{ __( 'No posts available' ) }
					</EmptyState.Title>
				</EmptyState.Root>
			}
		>
			<DataViews.Layout />
		</DataViews>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventsNews() {
	const locationInputId = useId();

	const userLocale = useSelect(
		( select ) =>
			( ( select( coreStore ) as any ).getCurrentUser()
				?.locale as string ) ?? 'en_US',
		[]
	);

	const [ locationInput, setLocationInput ] = useState( '' );
	const [ activeLocation, setActiveLocation ] = useState( '' );
	const [ locationLabel, setLocationLabel ] = useState( '' );
	const [ isEditingLocation, setIsEditingLocation ] = useState( false );

	const [ events, setEvents ] = useState< WPEvent[] >( [] );
	const [ eventsLoading, setEventsLoading ] = useState( true );
	const [ eventsError, setEventsError ] = useState( false );

	const [ newsFeeds, setNewsFeeds ] = useState< NewsFeed[] >( [] );
	const [ newsLoading, setNewsLoading ] = useState( true );

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

	useEffect( () => {
		Promise.all(
			NEWS_FEEDS.map( async ( feed ) => {
				try {
					const posts: NewsPost[] = await fetch( feed.apiUrl ).then(
						( r ) => r.json()
					);
					return { label: feed.label, siteUrl: feed.siteUrl, posts };
				} catch {
					return {
						label: feed.label,
						siteUrl: feed.siteUrl,
						posts: [],
					};
				}
			} )
		)
			.then( setNewsFeeds )
			.finally( () => setNewsLoading( false ) );
	}, [] );

	return (
		<>
			{ /* Community Events section */ }
			<div className={ styles.section }>
				<div className={ styles.locationBar }>
					{ locationLabel && ! isEditingLocation ? (
						<Text variant="body-sm">
							{ sprintf(
								/* translators: %s: The name of a city. */
								__( 'Attend an upcoming event near %s.' ),
								locationLabel
							) }{ ' ' }
							<Link
								onClick={ () => {
									setLocationInput( activeLocation );
									setIsEditingLocation( true );
								} }
							>
								{ __( 'Select location' ) }
							</Link>
						</Text>
					) : (
						<form
							onSubmit={ ( e ) => {
								e.preventDefault();
								setActiveLocation( locationInput );
								setIsEditingLocation( false );
							} }
						>
							<Stack
								direction="row"
								align="center"
								wrap="wrap"
								gap="sm"
							>
								<label htmlFor={ locationInputId }>
									{ __( 'City:' ) }
								</label>
								<input
									id={ locationInputId }
									className={ styles.locationInput }
									type="text"
									value={ locationInput }
									onChange={ ( e ) =>
										setLocationInput( e.target.value )
									}
									// translators: Replace with a recognizable city in your locale.
									placeholder={ __( 'Cincinnati' ) }
								/>
								<Button
									variant="outlined"
									tone="neutral"
									size="compact"
									type="submit"
								>
									{ __( 'Submit' ) }
								</Button>
								{ isEditingLocation && (
									<Link
										onClick={ () =>
											setIsEditingLocation( false )
										}
									>
										{ __( 'Cancel' ) }
									</Link>
								) }
							</Stack>
						</form>
					) }
				</div>

				<EventsList
					events={ events }
					loading={ eventsLoading }
					error={ eventsError }
				/>
			</div>

			{ /* WordPress News section */ }
			<div className={ styles.section }>
				{ newsLoading && (
					<p className={ styles.statusText }>
						{ __( 'Loading\u2026' ) }
					</p>
				) }
				{ newsFeeds.map( ( feed ) => (
					<Stack
						key={ feed.key }
						gap="xs"
						className={ styles.newsFeed }
					>
						<Text variant="label-sm" render={ <h3 /> }>
							<Link href={ feed.siteUrl }>{ feed.label }</Link>
						</Text>
						<NewsFeedList posts={ feed.posts } />
					</Stack>
				) ) }
			</div>

			{ /* Footer links */ }
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className={ styles.footer }
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
				<Link
					href={ _x(
						'https://wordpress.org/news/',
						'Events and News dashboard widget'
					) }
					openInNewTab
				>
					{ __( 'News' ) }
				</Link>
			</Stack>
		</>
	);
}
