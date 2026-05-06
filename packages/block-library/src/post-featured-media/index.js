/**
 * WordPress dependencies
 */
import { media as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/post-featured-image' ],
				transform: ( attributes ) =>
					createBlock( 'core/post-featured-media', {
						isLink: attributes.isLink,
						linkTarget: attributes.linkTarget,
						aspectRatio: attributes.aspectRatio,
						width: attributes.width,
						height: attributes.height,
						scale: attributes.scale,
						sizeSlug: attributes.sizeSlug,
						controls: true,
					} ),
			},
		],
	},
};

export const init = () => initBlock( { name, metadata, settings } );
