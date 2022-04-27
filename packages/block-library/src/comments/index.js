/**
 * WordPress dependencies
 */
import { postComments as icon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	deprecated: [
		{
			attributes: {
				tagName: {
					type: 'string',
					default: 'div',
				},
			},
			apiVersion: 2,
			supports: {
				align: [ 'wide', 'full' ],
				html: false,
				color: {
					gradients: true,
					link: true,
					__experimentalDefaultControls: {
						background: true,
						text: true,
						link: true,
					},
				},
			},
			save( { attributes: { tagName: Tag } } ) {
				return (
					<Tag className="wp-block-comments-query-loop">
						<InnerBlocks.Content />
					</Tag>
				);
			},
		},
	],
};
