/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate } from '@wordpress/date';
import { Spinner } from '@wordpress/components';
import { Icon, comment, postList } from '@wordpress/icons';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';

// Dashboard is still experimental.

import { Card, EmptyState, Link } from '@wordpress/ui';
import type { View, Field } from '@wordpress/dataviews';
import type { Post, Comment } from '@wordpress/core-data';

// ─── Item type ────────────────────────────────────────────────────────────────

type ActivityKind = 'post-future' | 'post-published' | 'comment';

type ActivityEvent = {
	id: string;
	// ISO date string — used for sorting and extracting the `date` group key.
	datetime: string;
	title: string;
	description: string;
	link: string;
	kind: ActivityKind;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Formats a `YYYY-MM-DD` string into a human-readable group label:
 *  - Today / Yesterday / "Jun 15th" / "Jun 15th 2023"
 *
 * @param {string} dateStr YYYY-MM-DD date string.
 */
function formatGroupDate( dateStr: string ): string {
	const now = getDate();
	const today = dateI18n( 'Y-m-d', now );

	if ( dateStr === today ) {
		return __( 'Today' );
	}

	const yesterday = getDate();
	yesterday.setDate( yesterday.getDate() - 1 );
	const yesterdayStr = dateI18n( 'Y-m-d', yesterday );

	if ( dateStr === yesterdayStr ) {
		return __( 'Yesterday' );
	}

	const currentYear = dateI18n( 'Y', now );

	if ( dateStr.slice( 0, 4 ) === currentYear ) {
		/* translators: Date format for dashboard activity group header (current year), see https://www.php.net/manual/datetime.format.php */
		return dateI18n( __( 'M jS' ), dateStr );
	}

	/* translators: Date format for dashboard activity group header (different year), see https://www.php.net/manual/datetime.format.php */
	return dateI18n( __( 'M jS Y' ), dateStr );
}

// ─── Fields ───────────────────────────────────────────────────────────────────

const FIELDS: Field< ActivityEvent >[] = [
	{
		id: 'icon',
		label: __( 'Icon' ),
		type: 'media',
		render: ( { item } ) => (
			<Icon icon={ item.kind === 'comment' ? comment : postList } />
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'content',
		label: __( 'Content' ),
		getValue: ( { item } ) => item.title,
		render: ( { item } ) => (
			<>
				<strong>{ item.title }</strong>
				{ item.description && (
					<>
						{ ': ' }
						<span
							dangerouslySetInnerHTML={ {
								__html: item.description,
							} }
						/>
					</>
				) }
			</>
		),
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		id: 'time',
		label: __( 'Time' ),
		getValue: ( { item } ) => item.datetime,
		render: ( { item } ) => (
			<span>
				{ /* translators: Time format for activity stream, see https://www.php.net/manual/datetime.format.php */ }
				{ dateI18n( __( 'g:i a' ), item.datetime ) }
			</span>
		),
		enableSorting: false,
	},
	{
		id: 'date',
		label: __( 'Date' ),
		getValue: ( { item } ) => item.datetime.split( 'T' )[ 0 ],
		render: ( { item } ) => (
			<span>{ formatGroupDate( item.datetime.split( 'T' )[ 0 ] ) }</span>
		),
		enableSorting: false,
		enableHiding: false,
	},
];

// ─── Default view ─────────────────────────────────────────────────────────────

const DEFAULT_VIEW: View = {
	type: 'activity',
	search: '',
	page: 1,
	perPage: 20,
	filters: [],
	fields: [ 'time' ],
	titleField: 'content',
	mediaField: 'icon',
	showMedia: true,
	sort: {
		field: 'datetime',
		direction: 'desc',
	},
	groupBy: {
		field: 'date',
		direction: 'desc',
		showLabel: false,
	},
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function Activity() {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const futurePosts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Post >( 'postType', 'post', {
				status: 'future',
				orderby: 'date',
				order: 'asc',
				per_page: 5,
			} ),
		[]
	);

	const recentPosts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Post >( 'postType', 'post', {
				status: 'publish',
				orderby: 'date',
				order: 'desc',
				per_page: 5,
			} ),
		[]
	);

	const comments = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Comment >(
				'root',
				'comment',
				{ per_page: 5 }
			),
		[]
	);

	const isResolved =
		futurePosts !== undefined &&
		recentPosts !== undefined &&
		comments !== undefined;

	const allEvents = useMemo< ActivityEvent[] >( () => {
		const events: ActivityEvent[] = [];

		for ( const post of futurePosts ?? [] ) {
			events.push( {
				id: `post-future-${ post.id }`,
				datetime: post.date ?? '',
				title: ( post.title as { rendered: string } )?.rendered ?? '',
				description: '',
				link: post.link ?? '',
				kind: 'post-future',
			} );
		}

		for ( const post of recentPosts ?? [] ) {
			events.push( {
				id: `post-published-${ post.id }`,
				datetime: post.date ?? '',
				title: ( post.title as { rendered: string } )?.rendered ?? '',
				description: '',
				link: post.link ?? '',
				kind: 'post-published',
			} );
		}

		for ( const c of comments ?? [] ) {
			events.push( {
				id: `comment-${ c.id }`,
				datetime: ( c.date as string ) ?? '',
				title: ( c.author_name as string ) ?? '',
				description:
					( c.content as { rendered: string } )?.rendered ?? '',
				link: ( c.link as string ) ?? '',
				kind: 'comment',
			} );
		}

		return events;
	}, [ futurePosts, recentPosts, comments ] );

	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( allEvents, view, FIELDS ),
		[ allEvents, view ]
	);

	if ( ! isResolved ) {
		return <Spinner />;
	}

	if ( allEvents.length === 0 ) {
		return (
			<EmptyState.Root>
				<EmptyState.Title>
					{ __( 'No activity yet.' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'When you publish posts or receive comments, they will appear here.'
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	return (
		<Card.Content>
			<Card.FullBleed>
				<DataViews
					data={ shownData }
					fields={ FIELDS }
					view={ view }
					onChangeView={ setView }
					paginationInfo={ paginationInfo }
					getItemId={ ( item ) => item.id }
					search={ false }
					isLoading={ false }
					defaultLayouts={ {
						activity: {
							sort: {
								field: 'datetime',
								direction: 'desc',
							},
						},
					} }
					renderItemLink={ ( { item, children, ...aProps } ) => (
						<Link href={ item.link } { ...aProps }>
							{ children }
						</Link>
					) }
					isItemClickable={ ( item ) => !! item.link }
				>
					<DataViews.Layout />
				</DataViews>
			</Card.FullBleed>
		</Card.Content>
	);
}
