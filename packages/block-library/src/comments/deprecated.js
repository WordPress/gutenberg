/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

// v1: Deprecate the initial version of the block which was called "Comments
// Query Loop" instead of "Comments".
const v1 = {
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
	save( { attributes: { className, tagName: Tag } } ) {
		return (
			<Tag
				className={ classnames(
					'wp-block-comments-query-loop',
					className
				) }
			>
				<InnerBlocks.Content />
			</Tag>
		);
	},
};

export default [ v1 ];
