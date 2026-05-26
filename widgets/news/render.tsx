/**
 * WordPress dependencies
 */
import {
	DataViews,
	filterSortAndPaginate,
	type Field,
	type View,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x } from '@wordpress/i18n';
import { globe, postList, wordpress } from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './render.module.css';

interface NewsPost {
	id: number;
	title: { rendered: string };
	link: string;
	date: string;
}

interface NewsFeed {
	key: string;
	label: string;
	siteUrl: string;
	posts: NewsPost[];
	totalPages: number;
}

type NewsItem = {
	id: string;
	feedKey: string;
	feedLabel: string;
	title: string;
	url: string;
	date: string;
};

type NewsAttributes = {
	perPage?: number;
};

const DEFAULT_PER_PAGE = 5;

const NEWS_FEEDS = [
	{
		key: 'news',
		label: __( 'WordPress Blog' ),
		siteUrl: _x( 'https://wordpress.org/news/', 'News dashboard widget' ),
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?_fields=id,title,link,date',
	},
	{
		key: 'planet',
		label: __( 'Other WordPress News' ),
		siteUrl: _x( 'https://planet.wordpress.org/', 'News dashboard widget' ),
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?_fields=id,title,link,date',
	},
];

const DEFAULT_LAYOUTS = { list: {} };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: DEFAULT_PER_PAGE,
	search: '',
	filters: [],
	fields: [],
	titleField: 'title',
	descriptionField: 'meta',
	mediaField: 'feedIcon',
	showMedia: true,
	layout: { density: 'compact' },
};

function FeedIcon( { item }: { item: NewsItem } ) {
	return (
		<div className={ styles.feedIcon } aria-hidden="true">
			<Icon icon={ item.feedKey === 'news' ? wordpress : globe } />
		</div>
	);
}

function NewsTitle( { item }: { item: NewsItem } ) {
	return (
		<Link href={ item.url } openInNewTab className={ styles.titleLink }>
			{ item.title }
		</Link>
	);
}

function NewsMeta( { item }: { item: NewsItem } ) {
	return (
		<Text variant="body-sm" className={ styles.meta }>
			{ item.feedLabel } · { dateI18n( __( 'M j, Y g:i a' ), item.date ) }
		</Text>
	);
}

const emptyState = (
	<Stack align="center" justify="center" style={ { margin: '24px 0' } }>
		<EmptyState.Root>
			<EmptyState.Icon icon={ postList } />
			<EmptyState.Title>
				{ __( 'Quiet for now — the next headline is on its way.' ) }
			</EmptyState.Title>
		</EmptyState.Root>
	</Stack>
);

function combineFeedPosts( newsFeeds: NewsFeed[] ): NewsItem[] {
	return newsFeeds
		.flatMap( ( feed ) =>
			feed.posts.map( ( post ) => ( {
				id: `${ feed.key }-${ post.id }`,
				feedKey: feed.key,
				feedLabel: feed.label,
				title: decodeEntities( post.title.rendered ),
				url: post.link,
				date: post.date,
			} ) )
		)
		.sort(
			( a, b ) =>
				new Date( b.date ).getTime() - new Date( a.date ).getTime()
		);
}

function extendPaginationInfo(
	paginationInfo: { totalItems: number; totalPages: number },
	limit: number,
	page: number,
	feeds: NewsFeed[]
): { totalItems: number; totalPages: number } {
	const fetchCount = limit * page;
	const hasMoreFromFeeds = feeds.some(
		( feed ) => feed.posts.length >= fetchCount && feed.totalPages > page
	);

	if ( ! hasMoreFromFeeds ) {
		return paginationInfo;
	}

	return {
		totalItems: Math.max( paginationInfo.totalItems, page * limit + 1 ),
		totalPages: Math.max( paginationInfo.totalPages, page + 1 ),
	};
}

async function fetchNewsFeed(
	feed: ( typeof NEWS_FEEDS )[ number ],
	fetchCount: number
): Promise< NewsFeed > {
	const apiUrl = `${ feed.apiUrl }&per_page=${ fetchCount }`;

	try {
		const response = await fetch( apiUrl );
		const posts: NewsPost[] = await response.json();

		return {
			key: feed.key,
			label: feed.label,
			siteUrl: feed.siteUrl,
			posts: Array.isArray( posts ) ? posts : [],
			totalPages: parseInt(
				response.headers.get( 'X-WP-TotalPages' ) ?? '1',
				10
			),
		};
	} catch {
		return {
			key: feed.key,
			label: feed.label,
			siteUrl: feed.siteUrl,
			posts: [],
			totalPages: 1,
		};
	}
}

export default function WordPressNews( {
	attributes,
}: {
	attributes?: NewsAttributes;
} ) {
	const limit = Math.max( 1, attributes?.perPage ?? DEFAULT_PER_PAGE );

	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	const [ newsFeeds, setNewsFeeds ] = useState< NewsFeed[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );

	const currentPage = Math.max( 1, view.page ?? 1 );

	useEffect( () => {
		setView( ( previousView ) => ( {
			...previousView,
			page: 1,
			perPage: limit,
		} ) );
	}, [ limit ] );

	useEffect( () => {
		setIsLoading( true );

		const fetchCount = limit * currentPage;

		Promise.all(
			NEWS_FEEDS.map( ( feed ) => fetchNewsFeed( feed, fetchCount ) )
		)
			.then( setNewsFeeds )
			.finally( () => setIsLoading( false ) );
	}, [ limit, currentPage ] );

	const allItems = useMemo(
		() => combineFeedPosts( newsFeeds ),
		[ newsFeeds ]
	);

	const resolvedView = useMemo(
		() => ( { ...view, perPage: limit, page: currentPage } ),
		[ view, limit, currentPage ]
	);

	const fields = useMemo< Field< NewsItem >[] >(
		() => [
			{
				id: 'title',
				label: __( 'Title' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <NewsTitle item={ item } />,
			},
			{
				id: 'meta',
				label: __( 'Source' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <NewsMeta item={ item } />,
			},
			{
				id: 'feedIcon',
				label: __( 'Source' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => <FeedIcon item={ item } />,
			},
		],
		[]
	);

	const { data: shownData, paginationInfo: clientPaginationInfo } = useMemo(
		() => filterSortAndPaginate( allItems, resolvedView, fields ),
		[ allItems, resolvedView, fields ]
	);

	const paginationInfo = useMemo(
		() =>
			extendPaginationInfo(
				clientPaginationInfo,
				limit,
				currentPage,
				newsFeeds
			),
		[ clientPaginationInfo, limit, currentPage, newsFeeds ]
	);

	return (
		<div className={ styles.root }>
			<DataViews
				data={ shownData }
				fields={ fields }
				view={ resolvedView }
				onChangeView={ setView }
				getItemId={ ( item ) => item.id }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				empty={ emptyState }
			>
				<DataViews.Layout />
				<footer className={ styles.footer }>
					<Stack
						direction="row"
						justify="space-between"
						align="center"
						gap="md"
					>
						<Link
							href={ _x(
								'https://wordpress.org/news/all-posts/',
								'News dashboard widget'
							) }
							openInNewTab
						>
							{ __( 'See all' ) }
						</Link>
						<DataViews.Pagination />
					</Stack>
				</footer>
			</DataViews>
		</div>
	);
}
