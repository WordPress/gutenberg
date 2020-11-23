/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const legacyWidgetTransforms = [
	{
		block: 'core/calendar',
		widget: 'WP_Widget_Calendar',
	},
	{
		block: 'core/search',
		widget: 'WP_Widget_Search',
	},
	{
		block: 'core/html',
		widget: 'WP_Widget_Custom_HTML',
		transform: ( { content } ) => ( {
			content,
		} ),
	},
	{
		block: 'core/archives',
		widget: 'WP_Widget_Archives',
		transform: ( { count, dropdown } ) => {
			return {
				displayAsDropdown: !! dropdown,
				showPostCounts: !! count,
			};
		},
	},
	{
		block: 'core/latest-posts',
		widget: 'WP_Widget_Recent_Posts',
		transform: ( { show_date: displayPostDate, number } ) => {
			return {
				displayPostDate: !! displayPostDate,
				postsToShow: number,
			};
		},
	},
	{
		block: 'core/latest-comments',
		widget: 'WP_Widget_Recent_Comments',
		transform: ( { number } ) => {
			return {
				commentsToShow: number,
			};
		},
	},
	{
		block: 'core/tag-cloud',
		widget: 'WP_Widget_Tag_Cloud',
		transform: ( { taxonomy, count } ) => {
			return {
				showTagCounts: !! count,
				taxonomy,
			};
		},
	},
	{
		block: 'core/categories',
		widget: 'WP_Widget_Categories',
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
		widget: 'WP_Widget_Media_Audio',
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
		widget: 'WP_Widget_Media_Video',
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
		widget: 'WP_Widget_Media_Image',
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
		widget: 'WP_Widget_Media_Gallery',
		transform: ( { ids, link_type: linkTo, size, number } ) => {
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
		widget: 'WP_Widget_RSS',
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
].map( ( { block, widget, transform } ) => {
	return {
		type: 'block',
		blocks: [ block ],
		isMatch: ( { widgetClass } ) => {
			return widgetClass === widget;
		},
		transform: ( { instance } ) => {
			const transformedBlock = createBlock(
				block,
				transform ? transform( instance ) : undefined
			);
			if ( ! instance || ! instance.title ) {
				return transformedBlock;
			}
			return [
				createBlock( 'core/heading', {
					content: instance.title,
				} ),
				transformedBlock,
			];
		},
	};
} );

const transforms = {
	to: legacyWidgetTransforms,
};

export default transforms;
