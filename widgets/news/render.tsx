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
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { globe, postList, wordpress } from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	DEFAULT_PER_PAGE,
	NEWS_FEED_LIST,
	NEWS_FEEDS,
	type NewsFeedSource,
} from './widget';
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
	showNews?: boolean;
	showCommunity?: boolean;
};

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

function hasMoreFeeds(
	feeds: NewsFeed[],
	limit: number,
	pagesDepth: number
): boolean {
	if ( ! feeds.length ) {
		return true;
	}

	const fetchCount = limit * pagesDepth;

	return feeds.some(
		( feed ) =>
			feed.posts.length >= fetchCount && feed.totalPages > pagesDepth
	);
}

function extendPaginationInfo(
	paginationInfo: { totalItems: number; totalPages: number },
	limit: number,
	page: number,
	feeds: NewsFeed[]
): { totalItems: number; totalPages: number } {
	if ( ! hasMoreFeeds( feeds, limit, page ) ) {
		return paginationInfo;
	}

	return {
		totalItems: Math.max( paginationInfo.totalItems, page * limit + 1 ),
		totalPages: Math.max( paginationInfo.totalPages, page + 1 ),
	};
}

async function fetchNewsFeed(
	feed: NewsFeedSource,
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

function getEnabledFeeds( attributes?: NewsAttributes ) {
	const showNews = attributes?.showNews ?? true;
	const showCommunity = attributes?.showCommunity ?? true;

	return NEWS_FEED_LIST.filter( ( feed ) => {
		if ( feed.key === 'news' ) {
			return showNews;
		}

		if ( feed.key === 'planet' ) {
			return showCommunity;
		}

		return true;
	} );
}

export default function WordPressNews( {
	attributes,
}: {
	attributes?: NewsAttributes;
} ) {
	const limit = Math.max( 1, attributes?.perPage ?? DEFAULT_PER_PAGE );
	const enabledFeeds = useMemo(
		() => getEnabledFeeds( attributes ),
		[ attributes?.showNews, attributes?.showCommunity ]
	);
	const enabledFeedKeys = useMemo(
		() => enabledFeeds.map( ( feed ) => feed.key ).join( ',' ),
		[ enabledFeeds ]
	);

	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	const [ newsFeeds, setNewsFeeds ] = useState< NewsFeed[] >( [] );
	const [ fetchedPages, setFetchedPages ] = useState( 0 );
	const [ isInitialLoading, setIsInitialLoading ] = useState( true );
	const fetchIdRef = useRef( 0 );

	const currentPage = Math.max( 1, view.page ?? 1 );

	const targetPages = useMemo( () => {
		const pagesDepth = Math.max( fetchedPages, currentPage );
		const prefetch = hasMoreFeeds( newsFeeds, limit, pagesDepth ) ? 1 : 0;

		return currentPage + prefetch;
	}, [ currentPage, fetchedPages, newsFeeds, limit ] );

	useEffect( () => {
		fetchIdRef.current += 1;
		setView( ( previousView ) => ( {
			...previousView,
			page: 1,
			perPage: limit,
		} ) );
		setNewsFeeds( [] );
		setFetchedPages( 0 );
		setIsInitialLoading( true );
	}, [ limit, enabledFeedKeys ] );

	useEffect( () => {
		if ( enabledFeeds.length === 0 ) {
			setNewsFeeds( [] );
			setFetchedPages( 0 );
			setIsInitialLoading( false );
			return;
		}

		if ( targetPages <= fetchedPages ) {
			return;
		}

		const fetchId = ++fetchIdRef.current;
		const isInitialFetch = fetchedPages === 0;

		if ( isInitialFetch ) {
			setIsInitialLoading( true );
		}

		const fetchCount = limit * targetPages;

		Promise.all(
			enabledFeeds.map( ( feed ) => fetchNewsFeed( feed, fetchCount ) )
		)
			.then( ( feeds ) => {
				if ( fetchId !== fetchIdRef.current ) {
					return;
				}

				setNewsFeeds( feeds );
				setFetchedPages( targetPages );
			} )
			.finally( () => {
				if ( fetchId === fetchIdRef.current && isInitialFetch ) {
					setIsInitialLoading( false );
				}
			} );
	}, [ limit, targetPages, fetchedPages, enabledFeedKeys, enabledFeeds ] );

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

	const hasDataForCurrentPage = allItems.length > ( currentPage - 1 ) * limit;
	const isFetchingMore = targetPages > fetchedPages;
	const isLoading =
		isInitialLoading || ( isFetchingMore && ! hasDataForCurrentPage );
	const showEmpty = ! isLoading && ! isFetchingMore && allItems.length === 0;
	const showNewsLink = attributes?.showNews ?? true;
	const showCommunityLink = attributes?.showCommunity ?? true;
	const hasFooterLinks = showNewsLink || showCommunityLink;
	const newsFeed = NEWS_FEEDS.news;
	const communityFeed = NEWS_FEEDS.planet;

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
				empty={ showEmpty ? emptyState : undefined }
			>
				<DataViews.Layout />
				<footer className={ styles.footer }>
					<Stack
						direction="row"
						justify={ hasFooterLinks ? 'space-between' : 'end' }
						align="center"
						gap="md"
						wrap="wrap"
					>
						{ hasFooterLinks && (
							<Stack
								direction="row"
								gap="md"
								wrap="wrap"
								className={ styles.footerLinks }
							>
								{ showNewsLink && newsFeed && (
									<Link
										href={ newsFeed.siteUrl }
										openInNewTab
									>
										{ newsFeed.label }
									</Link>
								) }
								{ showCommunityLink && communityFeed && (
									<Link
										href={ communityFeed.siteUrl }
										openInNewTab
									>
										{ communityFeed.label }
									</Link>
								) }
							</Stack>
						) }
						<div className={ styles.footerPagination }>
							<DataViews.Pagination />
						</div>
					</Stack>
				</footer>
			</DataViews>
		</div>
	);
}
