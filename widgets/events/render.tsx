/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
import { Icon, Link, Stack, EmptyState } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	EventsList,
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
	location,
}: {
	events: WPEvent[];
	loading: boolean;
	error: boolean;
	showEmptyState: boolean;
	location?: string;
} ) {
	if ( error ) {
		return (
			<p className={ styles.statusText }>
				{ __( 'An error occurred. Please try again.' ) }
			</p>
		);
	}

	return (
		<EventsList
			events={ events }
			showEmptyState={ showEmptyState }
			location={ location }
			isLoading={ loading }
		/>
	);
}

type WordPressEventsProps = {
	attributes?: EventsWidgetAttributes;
};

export default function WordPressEvents( {
	attributes = {},
}: WordPressEventsProps ) {
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
			setLocationLabel( '' );
			return;
		}

		const controller = new AbortController();
		setEventsLoading( true );
		setEventsError( false );
		setLocationLabel( '' );

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
			{ ! hasSelectedLocation && (
				<Stack
					align="center"
					justify="center"
					className={ styles.noLocationSelected }
				>
					<EmptyState.Root>
						<EmptyState.Visual>
							<Icon icon={ mapMarker } />
						</EmptyState.Visual>
						<EmptyState.Title>
							{ __( 'Attend an upcoming event near you.' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __( 'Select a city to view events.' ) }
						</EmptyState.Description>
					</EmptyState.Root>
				</Stack>
			) }
			{ hasSelectedLocation && eventsLoading && (
				<Stack
					className={ styles.locationPickerInWidget }
					direction="column"
					align="center"
					justify="center"
				>
					<Spinner />
				</Stack>
			) }
			{ hasSelectedLocation && ! eventsLoading && (
				<EventsListSection
					events={ events }
					loading={ eventsLoading }
					error={ eventsError }
					showEmptyState
					location={ locationLabel || activeLocation }
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
				</Stack>
			</div>
		</Stack>
	);
}
