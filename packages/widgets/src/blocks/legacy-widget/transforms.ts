import { createBlock } from '@wordpress/blocks';
import type { Block, BlockConfiguration } from '@wordpress/blocks';
import type { LegacyWidgetAttributes } from './index';

interface RawInstance extends Record< string, unknown > {
	content?: string;
	count?: number | boolean;
	dropdown?: boolean;
	show_date?: boolean;
	number?: number;
	taxonomy?: string;
	hierarchical?: boolean;
	url?: string;
	preload?: string;
	loop?: boolean;
	attachment_id?: number;
	alt?: string;
	caption?: string;
	height?: number;
	link_classes?: string;
	link_rel?: string;
	link_target_blank?: boolean;
	link_type?: string;
	link_url?: string;
	size?: string;
	width?: number;
	ids?: number[];
	show_author?: boolean;
	show_summary?: boolean;
	items?: number;
	title?: string;
}

interface LegacyWidgetTransformItem {
	block: string;
	widget: string;
	transform?: ( raw: RawInstance ) => Record< string, unknown >;
	transformBlock?: ( raw: RawInstance ) => Block;
}

const legacyWidgetTransforms: LegacyWidgetTransformItem[] = [
	{
		block: 'core/calendar',
		widget: 'calendar',
	},
	{
		block: 'core/search',
		widget: 'search',
	},
	{
		block: 'core/html',
		widget: 'custom_html',
		transformBlock: ( { content } ) =>
			createBlock( 'core/html', {}, [], [ content ?? null ] ),
	},
	{
		block: 'core/archives',
		widget: 'archives',
		transform: ( { count, dropdown } ) => {
			return {
				displayAsDropdown: !! dropdown,
				showPostCounts: !! count,
			};
		},
	},
	{
		block: 'core/latest-posts',
		widget: 'recent-posts',
		transform: ( { show_date: displayPostDate, number } ) => {
			return {
				displayPostDate: !! displayPostDate,
				postsToShow: number,
			};
		},
	},
	{
		block: 'core/latest-comments',
		widget: 'recent-comments',
		transform: ( { number } ) => {
			return {
				commentsToShow: number,
			};
		},
	},
	{
		block: 'core/tag-cloud',
		widget: 'tag_cloud',
		transform: ( { taxonomy, count } ) => {
			return {
				showTagCounts: !! count,
				taxonomy,
			};
		},
	},
	{
		block: 'core/categories',
		widget: 'categories',
		transform: ( { count, dropdown, hierarchical } ) => {
			return {
				displayAsDropdown: !! dropdown,
				showPostCounts: !! count,
				showHierarchy: !! hierarchical,
			};
		},
	},
	{
		block: 'core/audio',
		widget: 'media_audio',
		transform: ( { url, preload, loop, attachment_id: id } ) => {
			return {
				src: url,
				id,
				preload,
				loop,
			};
		},
	},
	{
		block: 'core/video',
		widget: 'media_video',
		transform: ( { url, preload, loop, attachment_id: id } ) => {
			return {
				src: url,
				id,
				preload,
				loop,
			};
		},
	},
	{
		block: 'core/image',
		widget: 'media_image',
		transform: ( {
			alt,
			attachment_id: id,
			caption,
			height,
			link_classes: linkClass,
			link_rel: rel,
			link_target_blank: targetBlack,
			link_type: linkDestination,
			link_url: link,
			size: sizeSlug,
			url,
			width,
		} ) => {
			return {
				alt,
				caption,
				height,
				id,
				link,
				linkClass,
				linkDestination,
				linkTarget: targetBlack ? '_blank' : undefined,
				rel,
				sizeSlug,
				url,
				width,
			};
		},
	},
	{
		block: 'core/gallery',
		widget: 'media_gallery',
		transform: ( { ids = [], link_type: linkTo, size, number } ) => {
			return {
				ids,
				columns: number,
				linkTo,
				sizeSlug: size,
				images: ids.map( ( id ) => ( {
					id,
				} ) ),
			};
		},
	},
	{
		block: 'core/rss',
		widget: 'rss',
		transform: ( {
			url,
			show_author: displayAuthor,
			show_date: displayDate,
			show_summary: displayExcerpt,
			items,
		} ) => {
			return {
				feedURL: url,
				displayAuthor: !! displayAuthor,
				displayDate: !! displayDate,
				displayExcerpt: !! displayExcerpt,
				itemsToShow: items,
			};
		},
	},
];

const transforms: NonNullable< BlockConfiguration[ 'transforms' ] > = {
	to: legacyWidgetTransforms.map(
		( { block, widget, transform, transformBlock } ) => ( {
			type: 'block',
			blocks: [ block ],
			isMatch: (
				attributes:
					Record< string, unknown > | Record< string, unknown >[]
			) => {
				const attrs = (
					Array.isArray( attributes ) ? attributes[ 0 ] : attributes
				) as LegacyWidgetAttributes | undefined;
				const raw = (
					attrs?.instance as { raw?: RawInstance } | null | undefined
				 )?.raw;
				return attrs?.idBase === widget && !! raw;
			},
			transform: (
				attributes:
					Record< string, unknown > | Record< string, unknown >[]
			) => {
				const attrs = (
					Array.isArray( attributes ) ? attributes[ 0 ] : attributes
				) as LegacyWidgetAttributes | undefined;
				const raw = (
					attrs?.instance as { raw?: RawInstance } | null | undefined
				 )?.raw;
				const transformedBlock = transformBlock
					? transformBlock( raw ?? {} )
					: createBlock(
							block,
							transform ? transform( raw ?? {} ) : undefined
						);
				if ( ! raw?.title ) {
					return transformedBlock;
				}
				return [
					createBlock( 'core/heading', {
						content: raw.title,
					} ),
					transformedBlock,
				];
			},
		} )
	),
};

export default transforms;
