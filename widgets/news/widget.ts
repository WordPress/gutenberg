import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	createPlanetWordPressFeedDescription,
	createWordPressNewsFeedDescription,
} from './feed-descriptions';

export const DEFAULT_PER_PAGE = 5;

export type NewsFeedKey = 'news' | 'planet';

export const NEWS_FEEDS = {
	news: {
		key: 'news',
		label: __( 'WordPress News' ),
		siteUrl: _x( 'https://wordpress.org/news/', 'News dashboard widget' ),
		apiUrl: 'https://wordpress.org/news/wp-json/wp/v2/posts?_fields=id,title,link,date',
	},
	planet: {
		key: 'planet',
		label: __( 'WordPress Planet' ),
		siteUrl: _x( 'https://planet.wordpress.org/', 'News dashboard widget' ),
		apiUrl: 'https://planet.wordpress.org/wp-json/wp/v2/posts?_fields=id,title,link,date',
	},
} as const satisfies Record<
	NewsFeedKey,
	{
		key: NewsFeedKey;
		label: string;
		siteUrl: string;
		apiUrl: string;
	}
>;

export type NewsFeedSource = ( typeof NEWS_FEEDS )[ NewsFeedKey ];

export const NEWS_FEED_LIST: NewsFeedSource[] = Object.values( NEWS_FEEDS );

const { news: wordpressNewsFeed, planet: planetWordPressFeed } = NEWS_FEEDS;

type NewsWidgetAttributes = {
	perPage?: number;
	showNews?: boolean;
	showCommunity?: boolean;
};

export default {
	name: 'core/news',
	title: __( 'WordPress news' ),
	attributes: [
		{
			id: 'perPage',
			type: 'integer',
			label: __( 'News per page' ),
			getValue: ( { item }: { item: NewsWidgetAttributes } ) =>
				item.perPage ?? DEFAULT_PER_PAGE,
			setValue: ( {
				item,
				value,
			}: {
				item: NewsWidgetAttributes;
				value: number;
			} ) => ( { ...item, perPage: value } ),
		},
		{
			id: 'showNews',
			type: 'boolean',
			Edit: 'toggle',
			label: wordpressNewsFeed.label,
			description:
				createWordPressNewsFeedDescription( wordpressNewsFeed ),
			getValue: ( { item }: { item: NewsWidgetAttributes } ) =>
				item.showNews ?? true,
			setValue: ( {
				item,
				value,
			}: {
				item: NewsWidgetAttributes;
				value: boolean;
			} ) => ( { ...item, showNews: value } ),
		},
		{
			id: 'showCommunity',
			type: 'boolean',
			Edit: 'toggle',
			label: planetWordPressFeed.label,
			description:
				createPlanetWordPressFeedDescription( planetWordPressFeed ),
			getValue: ( { item }: { item: NewsWidgetAttributes } ) =>
				item.showCommunity ?? true,
			setValue: ( {
				item,
				value,
			}: {
				item: NewsWidgetAttributes;
				value: boolean;
			} ) => ( { ...item, showCommunity: value } ),
		},
	],
	example: {
		attributes: {
			perPage: DEFAULT_PER_PAGE,
			showNews: true,
			showCommunity: true,
		},
	},
};
