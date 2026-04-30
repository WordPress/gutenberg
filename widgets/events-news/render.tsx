/**
 * WordPress dependencies
 */
import { useId, useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPEvent {
	type: 'wordcamp' | 'meetup' | 'online' | string;
	title: string;
	url: string;
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
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?per_page=2&_fields=id,title,link',
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
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?per_page=3&_fields=id,title,link',
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

function EventsList( {
	events,
	loading,
	error,
}: {
	events: WPEvent[];
	loading: boolean;
	error: boolean;
} ) {
	if ( loading ) {
		return <p className={ styles.statusText }>{ __( 'Loading\u2026' ) }</p>;
	}

	if ( error ) {
		return (
			<p className={ styles.statusText }>
				{ __( 'An error occurred. Please try again.' ) }
			</p>
		);
	}

	return (
		<ul className={ styles.eventsList }>
			{ events.map( ( event, index ) => (
				<li key={ index } className={ styles.event }>
					<div className={ styles.eventInfo }>
						<a
							className={ styles.eventTitle }
							href={ event.url }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ event.title }
						</a>
						<span className={ styles.eventMeta }>
							{ event.type !== 'online' && (
								<>
									<span>
										{ formatEventType( event.type ) }
									</span>
									<span
										className={ styles.metaSeparator }
										aria-hidden="true"
									>
										{ '\u00B7' }
									</span>
								</>
							) }
							<span>{ event.location.description }</span>
						</span>
					</div>
					<div className={ styles.eventDateTime }>
						<span>{ event.user_formatted_date }</span>
						{ event.type === 'meetup' &&
							event.user_formatted_time && (
								<span>
									{ event.user_formatted_time }{ ' ' }
									{ event.timeZoneAbbreviation }
								</span>
							) }
					</div>
				</li>
			) ) }
			{ events.length <= 2 && (
				<li className={ styles.eventNone }>
					{ sprintf(
						/* translators: %s: URL to meetup organizer documentation. */
						__(
							'Want more events? <a href="%s">Help organize the next one</a>!'
						),
						__(
							'https://make.wordpress.org/community/organize-event-landing-page/'
						)
					) }
				</li>
			) }
		</ul>
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
							<button
								className={ styles.linkButton }
								type="button"
								onClick={ () => {
									setLocationInput( activeLocation );
									setIsEditingLocation( true );
								} }
							>
								{ __( 'Select location' ) }
							</button>
						</Text>
					) : (
						<form
							className={ styles.locationForm }
							onSubmit={ ( e ) => {
								e.preventDefault();
								setActiveLocation( locationInput );
								setIsEditingLocation( false );
							} }
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
								<button
									type="button"
									className={ styles.linkButton }
									onClick={ () =>
										setIsEditingLocation( false )
									}
								>
									{ __( 'Cancel' ) }
								</button>
							) }
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
						<ul className={ styles.newsList }>
							{ feed.posts.map( ( post ) => (
								<li key={ post.id }>
									<Link href={ post.link }>
										{ decodeEntities(
											post.title.rendered
										) }
									</Link>
								</li>
							) ) }
						</ul>
					</Stack>
				) ) }
			</div>

			{ /* Footer links */ }
			<p className={ styles.footer }>
				<a
					href="https://make.wordpress.org/community/meetups-landing-page"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Meetups' ) }
				</a>
				{ ' | ' }
				<a
					href="https://central.wordcamp.org/schedule/"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'WordCamps' ) }
				</a>
				{ ' | ' }
				<a
					href={ _x(
						'https://wordpress.org/news/',
						'Events and News dashboard widget'
					) }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'News' ) }
				</a>
			</p>
		</>
	);
}
