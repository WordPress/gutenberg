/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, rawHandler } from '@wordpress/blocks';

const conversion = {
	text: {
		convert: ( { text } ) => rawHandler( { HTML: text } ),
	},
	calendar: {
		to: 'core/calendar',
	},
	search: {
		to: 'core/search',
	},
	custom_html: {
		to: 'core/html',
		convert: ( { content } ) => ( {
			content,
		} ),
	},
	archives: {
		to: 'core/archives',
		convert: ( { count, dropdown } ) => ( {
			displayAsDropdown: !! dropdown,
			showPostCounts: !! count,
		} ),
	},
	'recent-posts': {
		to: 'core/latest-posts',
		convert: ( { show_date: displayPostDate, number } ) => ( {
			displayPostDate: !! displayPostDate,
			postsToShow: number,
		} ),
	},
	'recent-comments': {
		to: 'core/latest-comments',
		convert: ( { number } ) => ( {
			commentsToShow: number,
		} ),
	},
	tag_cloud: {
		to: 'core/tag-cloud',
		convert: ( { taxonomy, count } ) => ( {
			showTagCounts: !! count,
			taxonomy,
		} ),
	},
	categories: {
		to: 'core/categories',
		convert: ( { count, dropdown, hierarchical } ) => ( {
			displayAsDropdown: !! dropdown,
			showPostCounts: !! count,
			showHierarchy: !! hierarchical,
		} ),
	},
	media_audio: {
		to: 'core/audio',
		convert: ( { url, preload, loop, attachment_id: id } ) => ( {
			src: url,
			id,
			preload,
			loop,
		} ),
	},
	media_video: {
		to: 'core/video',
		convert: ( { url, preload, loop, attachment_id: id } ) => ( {
			src: url,
			id,
			preload,
			loop,
		} ),
	},
	media_image: {
		to: 'core/image',
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
		} ) => ( {
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
	media_gallery: {
		to: 'core/gallery',
		convert: ( { ids, link_type: linkTo, size, number } ) => ( {
			ids,
			columns: number,
			linkTo,
			sizeSlug: size,
			images: ids.map( ( id ) => ( {
				id,
			} ) ),
		} ),
	},
	rss: {
		to: 'core/rss',
		convert: ( {
			url,
			show_author: displayAuthor,
			show_date: displayDate,
			show_summary: displayExcerpt,
			items,
		} ) => ( {
			feedURL: url,
			displayAuthor: !! displayAuthor,
			displayDate: !! displayDate,
			displayExcerpt: !! displayExcerpt,
			itemsToShow: items,
		} ),
	},
};

/**
 * Converts a widget into its equivalent block representation.
 *
 * @param {string} idBase      The type of the widget to convert.
 * @param {Object} rawInstance The raw instance settings of the widget to convert.
 *
 * @return {Array} List of blocks, or an empty array.
 */
export function convertLegacyWidgetToBlocks( idBase, rawInstance ) {
	if ( ! ( idBase in conversion ) ) {
		return [];
	}

	const { to, convert } = conversion[ idBase ];

	let blocks;
	if ( to ) {
		blocks = [ createBlock( to, convert?.( rawInstance ) ) ];
	} else {
		blocks = convert ? castArray( convert( rawInstance ) ) : [];
	}

	if ( ! rawInstance.title ) {
		return blocks;
	}
	return [
		createBlock( 'core/heading', { content: rawInstance.title } ),
		...blocks,
	];
}

/**
 * Block transforms for the Legacy Widget block.
 */
export const transforms = {
	to: Object.entries( conversion )
		.filter( ( [ , { to } ] ) => to )
		.map( ( [ idBase, { to } ] ) => ( {
			type: 'block',
			blocks: [ to ],
			isMatch: ( { idBase: candidateIdBase, instance } ) =>
				candidateIdBase === idBase && !! instance?.raw,
			transform: ( { instance } ) =>
				convertLegacyWidgetToBlocks( idBase, instance.raw ),
		} ) ),
};
