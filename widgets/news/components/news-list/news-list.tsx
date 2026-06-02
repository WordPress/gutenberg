/**
 * WordPress dependencies
 */
import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x } from '@wordpress/i18n';
import { globe, postList, wordpress } from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './news-list.module.css';

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
}

type NewsItem = {
	id: string;
	feedKey: string;
	feedLabel: string;
	title: string;
	url: string;
	date: string;
};

const NEWS_FEEDS = [
	{
		key: 'news',
		label: __( 'WordPress Blog' ),
		siteUrl: _x( 'https://wordpress.org/news/', 'News dashboard widget' ),
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?per_page=4&_fields=id,title,link,date',
	},
	{
		key: 'planet',
		label: __( 'Other WordPress News' ),
		siteUrl: _x( 'https://planet.wordpress.org/', 'News dashboard widget' ),
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?per_page=4&_fields=id,title,link,date',
	},
];

const DEFAULT_LAYOUTS = { list: {} };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: 4,
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

/*
 * Renders WordPress.org and Planet WordPress posts through the DataViews list
 * layout. Mounting this component triggers the feed requests.
 */
export function NewsList() {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	const [ newsFeeds, setNewsFeeds ] = useState< NewsFeed[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		Promise.all(
			NEWS_FEEDS.map( async ( feed ) => {
				try {
					const posts: NewsPost[] = await fetch( feed.apiUrl ).then(
						( r ) => r.json()
					);
					return {
						key: feed.key,
						label: feed.label,
						siteUrl: feed.siteUrl,
						posts,
					};
				} catch {
					return {
						key: feed.key,
						label: feed.label,
						siteUrl: feed.siteUrl,
						posts: [],
					};
				}
			} )
		)
			.then( setNewsFeeds )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const items = useMemo( () => combineFeedPosts( newsFeeds ), [ newsFeeds ] );

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

	return (
		<div className={ styles.root }>
			<DataViews
				data={ items }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				getItemId={ ( item ) => item.id }
				isLoading={ isLoading }
				paginationInfo={ {
					totalItems: items.length,
					totalPages: 1,
				} }
				defaultLayouts={ DEFAULT_LAYOUTS }
				empty={ emptyState }
			>
				<DataViews.Layout />
			</DataViews>
		</div>
	);
}
