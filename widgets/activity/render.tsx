/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { Spinner } from '@wordpress/components';
import { Icon, comment, postList } from '@wordpress/icons';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { EmptyState, Link, Stack } from '@wordpress/ui';
import type { View, Field } from '@wordpress/dataviews';
import type { Post, Comment } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

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

type ActivityAttributes = {
	// How many items of each activity type to fetch.
	perPage?: number;
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

/*
 * Converts a comment's rendered HTML into a plain-text excerpt, matching the
 * classic dashboard which shows comment content without markup.
 */
function htmlToPlainText( html: string ): string {
	const { body } = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);
	return ( body.textContent ?? '' ).trim();
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
		id: 'title',
		label: __( 'Title' ),
		type: 'text',
		getValue: ( { item } ) => item.title,
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		id: 'description',
		label: __( 'Description' ),
		type: 'text',
		getValue: ( { item } ) => item.description,
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		id: 'datetime',
		label: __( 'Time' ),
		getValue: ( { item } ) => item.datetime,
		render: ( { item } ) => (
			<span>
				{ /* translators: Time format for activity stream, see https://www.php.net/manual/datetime.format.php */ }
				{ dateI18n( __( 'g:i a' ), item.datetime ) }
			</span>
		),
		enableSorting: true,
	},
	{
		id: 'date',
		label: __( 'Date' ),
		getValue: ( { item } ) => item.datetime.split( 'T' )[ 0 ],
		render: ( { item } ) => (
			<span>{ formatGroupDate( item.datetime.split( 'T' )[ 0 ] ) }</span>
		),
		enableSorting: true,
		enableHiding: false,
	},
];

// ─── Default view ─────────────────────────────────────────────────────────────

// Default number of items fetched per activity type.
const DEFAULT_PER_PAGE = 5;

// Activity sources merged into the stream: scheduled posts, published posts,
// and comments. Used to size the page so every fetched item is shown.
const SOURCE_COUNT = 3;

const DEFAULT_VIEW: View = {
	type: 'activity',
	search: '',
	page: 1,
	perPage: DEFAULT_PER_PAGE,
	filters: [],
	fields: [ 'datetime' ],
	titleField: 'title',
	descriptionField: 'description',
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

export default function Activity( {
	attributes,
}: {
	attributes?: ActivityAttributes;
} ) {
	const perPage = Math.max( 1, attributes?.perPage ?? DEFAULT_PER_PAGE );

	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	// Fetch up to `perPage` items from each source so all three activity types
	// are represented; the merged result is sorted into one stream.
	const queries = useMemo(
		() => ( {
			future: {
				status: 'future',
				orderby: 'date',
				order: 'asc',
				per_page: perPage,
			},
			recent: {
				status: 'publish',
				orderby: 'date',
				order: 'desc',
				per_page: perPage,
			},
			comments: { per_page: perPage },
		} ),
		[ perPage ]
	);

	const { futurePosts, recentPosts, comments, isResolved } = useSelect(
		( select ) => {
			const coreData = select( coreStore );

			return {
				futurePosts: coreData.getEntityRecords< Post >(
					'postType',
					'post',
					queries.future
				),
				recentPosts: coreData.getEntityRecords< Post >(
					'postType',
					'post',
					queries.recent
				),
				comments: coreData.getEntityRecords< Comment >(
					'root',
					'comment',
					queries.comments
				),
				isResolved:
					coreData.hasFinishedResolution( 'getEntityRecords', [
						'postType',
						'post',
						queries.future,
					] ) &&
					coreData.hasFinishedResolution( 'getEntityRecords', [
						'postType',
						'post',
						queries.recent,
					] ) &&
					coreData.hasFinishedResolution( 'getEntityRecords', [
						'root',
						'comment',
						queries.comments,
					] ),
			};
		},
		[ queries ]
	);

	const allEvents = useMemo< ActivityEvent[] >( () => {
		const events: ActivityEvent[] = [];

		for ( const post of futurePosts ?? [] ) {
			events.push( {
				id: `post-future-${ post.id }`,
				datetime: post.date ?? '',
				title: decodeEntities(
					( post.title as { rendered: string } )?.rendered ?? ''
				),
				description: '',
				link: post.link ?? '',
				kind: 'post-future',
			} );
		}

		for ( const post of recentPosts ?? [] ) {
			events.push( {
				id: `post-published-${ post.id }`,
				datetime: post.date ?? '',
				title: decodeEntities(
					( post.title as { rendered: string } )?.rendered ?? ''
				),
				description: '',
				link: post.link ?? '',
				kind: 'post-published',
			} );
		}

		for ( const c of comments ?? [] ) {
			events.push( {
				id: `comment-${ c.id }`,
				datetime: ( c.date as string ) ?? '',
				title: decodeEntities( ( c.author_name as string ) ?? '' ),
				description: htmlToPlainText(
					( c.content as { rendered: string } )?.rendered ?? ''
				),
				link: ( c.link as string ) ?? '',
				kind: 'comment',
			} );
		}

		return events;
	}, [ futurePosts, recentPosts, comments ] );

	// Size the page to the full merged set (up to `perPage` per source) so every
	// fetched item is shown; the widget has no pagination UI yet.
	const resolvedView = useMemo(
		() => ( { ...view, perPage: perPage * SOURCE_COUNT } ),
		[ view, perPage ]
	);

	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( allEvents, resolvedView, FIELDS ),
		[ allEvents, resolvedView ]
	);

	if ( ! isResolved ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				className={ styles.loading }
			>
				<Spinner />
			</Stack>
		);
	}

	if ( allEvents.length === 0 ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				className={ styles.loading }
			>
				<EmptyState.Root>
					<EmptyState.Icon icon={ postList } />
					<EmptyState.Title>
						{ __( 'No activity yet.' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'When you publish posts or receive comments, they will appear here.'
						) }
					</EmptyState.Description>
				</EmptyState.Root>
			</Stack>
		);
	}

	return (
		<Stack direction="column" className={ styles.list }>
			<DataViews
				data={ shownData }
				fields={ FIELDS }
				view={ resolvedView }
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
		</Stack>
	);
}
