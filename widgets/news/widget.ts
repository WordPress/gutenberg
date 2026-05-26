import { __, sprintf } from '@wordpress/i18n';

export const DEFAULT_PER_PAGE = 5;

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
			description: sprintf(
				/* translators: %d: default number of news items per page. */
				__( 'Default: %d.' ),
				DEFAULT_PER_PAGE
			),
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
			label: __( 'WordPress Blog' ),
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
			label: __( 'WordPress community' ),
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
