/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const toTransforms = [
	{
		idBase: 'calendar',
		blockName: 'core/calendar',
		convert: () => createBlock( 'core/calendar' ),
	},
	{
		idBase: 'search',
		blockName: 'core/search',
		convert: () => createBlock( 'core/search' ),
	},
	{
		idBase: 'custom_html',
		blockName: 'core/html',
		convert: ( { content } ) =>
			createBlock( 'core/html', {
				content,
			} ),
	},
	{
		idBase: 'archives',
		blockName: 'core/archives',
		convert: ( { count, dropdown } ) =>
			createBlock( 'core/archives', {
				displayAsDropdown: !! dropdown,
				showPostCounts: !! count,
			} ),
	},
	{
		idBase: 'recent-posts',
		blockName: 'core/latest-posts',
		convert: ( { show_date: displayPostDate, number } ) =>
			createBlock( 'core/latest-posts', {
				displayPostDate: !! displayPostDate,
				postsToShow: number,
			} ),
	},
	{
		idBase: 'recent-comments',
		blockName: 'core/latest-comments',
		convert: ( { number } ) =>
			createBlock( 'core/latest-comments', {
				commentsToShow: number,
			} ),
	},
	{
		idBase: 'tag_cloud',
		blockName: 'core/tag-cloud',
		convert: ( { taxonomy, count } ) =>
			createBlock( 'core/tag-cloud', {
				showTagCounts: !! count,
				taxonomy,
			} ),
	},
	{
		idBase: 'categories',
		blockName: 'core/categories',
		convert: ( { count, dropdown, hierarchical } ) =>
			createBlock( 'core/categories', {
				displayAsDropdown: !! dropdown,
				showPostCounts: !! count,
				showHierarchy: !! hierarchical,
			} ),
	},
	{
		idBase: 'media_audio',
		blockName: 'core/audio',
		convert: ( { url, preload, loop, attachment_id: id } ) =>
			createBlock( 'core/audio', {
				src: url,
				id,
				preload,
				loop,
			} ),
	},
	{
		idBase: 'media_video',
		blockName: 'core/video',
		convert: ( { url, preload, loop, attachment_id: id } ) =>
			createBlock( 'core/video', {
				src: url,
				id,
				preload,
				loop,
			} ),
	},
	{
		idBase: 'media_image',
		blockName: 'core/image',
		convert: ( {
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
		} ) =>
			createBlock( 'core/image', {
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
			} ),
	},
	{
		idBase: 'media_gallery',
		blockName: 'core/gallery',
		convert: ( { ids, link_type: linkTo, size, number } ) =>
			createBlock( 'core/gallery', {
				ids,
				columns: number,
				linkTo,
				sizeSlug: size,
				images: ids.map( ( id ) => ( {
					id,
				} ) ),
			} ),
	},
	{
		idBase: 'rss',
		blockName: 'core/rss',
		convert: ( {
			url,
			show_author: displayAuthor,
			show_date: displayDate,
			show_summary: displayExcerpt,
			items,
		} ) =>
			createBlock( 'core/rss', {
				feedURL: url,
				displayAuthor: !! displayAuthor,
				displayDate: !! displayDate,
				displayExcerpt: !! displayExcerpt,
				itemsToShow: items,
			} ),
	},
	{
		idBase: 'nav_menu',
		blockName: 'core/navigation',
		convert: ( { nav_menu: navMenu } ) =>
			createBlock( 'core/navigation', {}, [], { menuId: navMenu } ),
	},
].map( ( { idBase, blockName, convert } ) => {
	return {
		type: 'block',
		blocks: [ blockName ],
		isMatch( attributes ) {
			return attributes.idBase === idBase && !! attributes.instance?.raw;
		},
		transform( attributes ) {
			const block = convert( attributes.instance.raw );
			if ( ! attributes.instance.raw?.title ) {
				return block;
			}
			return [
				createBlock( 'core/heading', {
					content: attributes.instance.raw.title,
				} ),
				block,
			];
		},
	};
} );

const transforms = {
	to: toTransforms,
};

export default transforms;
