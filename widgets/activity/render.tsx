/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate } from '@wordpress/date';
import { Spinner } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';

// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { EmptyState, Link, Card, Text } from '@wordpress/ui';
import type { View, Field } from '@wordpress/dataviews';
import type { Post, Comment } from '@wordpress/core-data';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Formats a date string into a human-readable label, mirroring the PHP logic
 * in `wp_dashboard_recent_posts()`. Uses `dateI18n` so the result respects the
 * site timezone and locale (same as PHP's `date_i18n()`):
 *
 *  - Same calendar day  → "Today"
 *  - Next calendar day  → "Tomorrow"
 *  - Same year          → "Jun 15th"
 *  - Different year     → "Jun 15th 2023"
 *
 * @param {string} dateString ISO date string to format.
 */
function formatDate( dateString: string ): string {
	const now = getDate();
	const postDay = dateI18n( 'Y-m-d', dateString );
	const today = dateI18n( 'Y-m-d', now );

	if ( postDay === today ) {
		return __( 'Today' );
	}

	const tomorrow = getDate();
	tomorrow.setDate( tomorrow.getDate() + 1 );
	const tomorrowDay = dateI18n( 'Y-m-d', tomorrow );

	if ( postDay === tomorrowDay ) {
		return __( 'Tomorrow' );
	}

	const postYear = dateI18n( 'Y', dateString );
	const currentYear = dateI18n( 'Y', now );

	if ( postYear !== currentYear ) {
		/* translators: Date format for dashboard posts from a different year, see https://www.php.net/manual/datetime.format.php */
		return dateI18n( __( 'M jS Y' ), dateString );
	}

	/* translators: Date format for dashboard posts from the current year, see https://www.php.net/manual/datetime.format.php */
	return dateI18n( __( 'M jS' ), dateString );
}

// ─── Item types ───────────────────────────────────────────────────────────────

type PostItem = {
	id: string;
	title: string;
	date: string;
	link: string;
};

type CommentItem = {
	id: string;
	title: string;
	date: string;
	link: string;
	/** HTML snippet from the comment body. */
	description: string;
};

// ─── Fields ───────────────────────────────────────────────────────────────────

const POST_FIELDS: Field< PostItem >[] = [
	{
		id: 'title',
		label: __( 'Title' ),
		getValue: ( { item } ) => item.title,
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		id: 'date',
		label: __( 'Date' ),
		getValue: ( { item } ) => item.date,
		render: ( { item } ) =>
			sprintf(
				/* translators: 1: date label (Today / Jun 15th), 2: time */
				__( '%1$s, %2$s' ),
				formatDate( item.date ),
				/* translators: Time format for dashboard post list, see https://www.php.net/manual/datetime.format.php */
				dateI18n( __( 'g:i a' ), item.date )
			),
		enableSorting: false,
	},
];

const COMMENT_FIELDS: Field< CommentItem >[] = [
	{
		id: 'title',
		label: __( 'Author' ),
		getValue: ( { item } ) => item.title,
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		id: 'date',
		label: __( 'Date' ),
		getValue: ( { item } ) => item.date,
		render: ( { item } ) =>
			sprintf(
				/* translators: 1: date label (Today / Jun 15th), 2: time */
				__( '%1$s, %2$s' ),
				formatDate( item.date ),
				/* translators: Time format for dashboard post list, see https://www.php.net/manual/datetime.format.php */
				dateI18n( __( 'g:i a' ), item.date )
			),
		enableSorting: false,
	},
	{
		id: 'description',
		label: __( 'Comment' ),
		getValue: ( { item } ) => item.description,
		render: ( { item } ) =>
			item.description ? (
				<span
					dangerouslySetInnerHTML={ { __html: item.description } }
				/>
			) : null,
		enableSorting: false,
	},
];

// ─── Default views ────────────────────────────────────────────────────────────

const DEFAULT_POST_VIEW: View = {
	type: 'activity',
	titleField: 'title',
	fields: [ 'date' ],
	page: 1,
	perPage: 5,
	layout: { density: 'compact' },
};

const DEFAULT_COMMENT_VIEW: View = {
	type: 'activity',
	titleField: 'title',
	descriptionField: 'description',
	fields: [ 'date' ],
	page: 1,
	perPage: 5,
	layout: { density: 'compact' },
};

// ─── Link renderers ───────────────────────────────────────────────────────────

function renderPostLink( {
	item,
	children,
	...aProps
}: { item: PostItem } & React.ComponentProps< 'a' > ) {
	return (
		<Link href={ item.link } { ...aProps }>
			{ children }
		</Link>
	);
}

function renderCommentLink( {
	item,
	children,
	...aProps
}: { item: CommentItem } & React.ComponentProps< 'a' > ) {
	return (
		<Link href={ item.link } { ...aProps }>
			{ children }
		</Link>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Activity() {
	const [ futureView, setFutureView ] = useState< View >( DEFAULT_POST_VIEW );
	const [ recentView, setRecentView ] = useState< View >( DEFAULT_POST_VIEW );
	const [ commentView, setCommentView ] =
		useState< View >( DEFAULT_COMMENT_VIEW );

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

	const futureItems = useMemo< PostItem[] >(
		() =>
			( futurePosts ?? [] ).map( ( post ) => ( {
				id: `post-future-${ post.id }`,
				title: ( post.title as { rendered: string } )?.rendered ?? '',
				date: post.date ?? '',
				link: post.link ?? '',
			} ) ),
		[ futurePosts ]
	);

	const recentItems = useMemo< PostItem[] >(
		() =>
			( recentPosts ?? [] ).map( ( post ) => ( {
				id: `post-recent-${ post.id }`,
				title: ( post.title as { rendered: string } )?.rendered ?? '',
				date: post.date ?? '',
				link: post.link ?? '',
			} ) ),
		[ recentPosts ]
	);

	const commentItems = useMemo< CommentItem[] >(
		() =>
			( comments ?? [] ).map( ( comment ) => ( {
				id: `comment-${ comment.id }`,
				title: ( comment.author_name as string ) ?? '',
				date: ( comment.date as string ) ?? '',
				link: ( comment.link as string ) ?? '',
				description:
					( comment.content as { rendered: string } )?.rendered ?? '',
			} ) ),
		[ comments ]
	);

	if ( ! isResolved ) {
		return <Spinner />;
	}

	const isEmpty =
		futureItems.length === 0 &&
		recentItems.length === 0 &&
		commentItems.length === 0;

	if ( isEmpty ) {
		return (
			<EmptyState.Root>
				<EmptyState.Title>
					{ __( 'No activity yet!' ) }
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
		<>
			{ futureItems.length > 0 && (
				<>
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Publishing Soon' ) }
					</Text>
					<Card.FullBleed>
						<DataViews
							data={ futureItems }
							fields={ POST_FIELDS }
							view={ futureView }
							onChangeView={ setFutureView }
							paginationInfo={ {
								totalItems: futureItems.length,
								totalPages: 1,
							} }
							getItemId={ ( item ) => item.id }
							search={ false }
							isLoading={ false }
							defaultLayouts={ { activity: {} } }
							renderItemLink={ renderPostLink }
							isItemClickable={ ( item ) => !! item.link }
						>
							<DataViews.Layout />
						</DataViews>
					</Card.FullBleed>
				</>
			) }

			{ recentItems.length > 0 && (
				<>
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Recently Published' ) }
					</Text>
					<Card.FullBleed>
						<DataViews
							data={ recentItems }
							fields={ POST_FIELDS }
							view={ recentView }
							onChangeView={ setRecentView }
							paginationInfo={ {
								totalItems: recentItems.length,
								totalPages: 1,
							} }
							getItemId={ ( item ) => item.id }
							search={ false }
							isLoading={ false }
							defaultLayouts={ { activity: {} } }
							renderItemLink={ renderPostLink }
							isItemClickable={ ( item ) => !! item.link }
						>
							<DataViews.Layout />
						</DataViews>
					</Card.FullBleed>
				</>
			) }

			{ commentItems.length > 0 && (
				<>
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Recent Comments' ) }
					</Text>
					<Card.FullBleed>
						<DataViews
							data={ commentItems }
							fields={ COMMENT_FIELDS }
							view={ commentView }
							onChangeView={ setCommentView }
							paginationInfo={ {
								totalItems: commentItems.length,
								totalPages: 1,
							} }
							getItemId={ ( item ) => item.id }
							search={ false }
							isLoading={ false }
							defaultLayouts={ { activity: {} } }
							renderItemLink={ renderCommentLink }
							isItemClickable={ ( item ) => !! item.link }
						>
							<DataViews.Layout />
						</DataViews>
					</Card.FullBleed>
				</>
			) }
		</>
	);
}
