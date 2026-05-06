/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { dateI18n } from '@wordpress/date';
import { __, _x } from '@wordpress/i18n';
import { globe, postList, wordpress } from '@wordpress/icons';
import { Spinner } from '@wordpress/components';
/* eslint-disable @wordpress/use-recommended-components */
import { Card, EmptyState, Icon, Link, Stack } from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import List, { type ListItem } from './list';

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

const NEWS_FEEDS = [
	{
		key: 'news',
		label: __( 'WordPress Blog' ),
		siteUrl: _x(
			'https://wordpress.org/news/',
			'Events and News dashboard widget'
		),
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?per_page=3&_fields=id,title,link,date',
	},
	{
		key: 'planet',
		label: __( 'Other WordPress News' ),
		siteUrl: _x(
			'https://planet.wordpress.org/',
			'Events and News dashboard widget'
		),
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?per_page=3&_fields=id,title,link,date',
	},
];

function decodeEntities( html: string ): string {
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = html;
	return txt.value;
}

export default function WordPressNews() {
	const [ newsFeeds, setNewsFeeds ] = useState< NewsFeed[] >( [] );
	const [ newsLoading, setNewsLoading ] = useState( true );

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
			.finally( () => setNewsLoading( false ) );
	}, [] );

	const combinedItems: ListItem[] = newsFeeds
		.flatMap( ( feed ) =>
			feed.posts.map( ( post ) => ( {
				feedKey: feed.key,
				feedLabel: feed.label,
				id: post.id,
				title: decodeEntities( post.title.rendered ),
				url: post.link,
				date: post.date,
			} ) )
		)
		.sort(
			( a, b ) =>
				new Date( b.date ).getTime() - new Date( a.date ).getTime()
		)
		.map( ( post ) => ( {
			id: `${ post.feedKey }-${ post.id }`,
			title: post.title,
			url: post.url,
			icon:
				post.feedKey === 'news' ? (
					<Icon icon={ wordpress } />
				) : (
					<Icon icon={ globe } />
				),
			meta: [
				post.feedLabel,
				dateI18n( __( 'M j, Y g:i a' ), post.date ),
			],
		} ) );

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

	return (
		<Card.Content>
			<Stack direction="column" justify="start" gap="md">
				{ newsLoading && (
					<Stack justify="center" align="center">
						<Spinner />
					</Stack>
				) }
				<List items={ combinedItems } empty={ emptyState } />
				<Link
					href={ _x(
						'https://wordpress.org/news/all-posts/',
						'Events and News dashboard widget'
					) }
					openInNewTab
				>
					{ __( 'See all' ) }
				</Link>
			</Stack>
		</Card.Content>
	);
}
