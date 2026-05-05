/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { dateI18n } from '@wordpress/date';
import { __, _x } from '@wordpress/i18n';
import { globe, postList, wordpress } from '@wordpress/icons';
import { Spinner } from '@wordpress/components';
// Dashboard is still experimental.
/* eslint-disable @wordpress/use-recommended-components */
import { EmptyState, Icon, Stack } from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import styles from './style.module.css';
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

function decodeEntities( html: string ): string {
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = html;
	return txt.value;
}

export default function NewsSection() {
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
		<div className={ styles.section }>
			{ newsLoading && (
				<Stack justify="center" align="center">
					<Spinner />
				</Stack>
			) }
			<List items={ combinedItems } empty={ emptyState } />
		</div>
	);
}
