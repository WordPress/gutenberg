/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

// v1: Deprecate the initial version of the block which was called "Comments
// Query Loop" instead of "Comments".
const v1 = {
	attributes: {
		tagName: {
			type: 'string',
			default: 'div',
		},
	},
	apiVersion: 3,
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
		const blockProps = useBlockProps.save();
		const { className } = blockProps;
		const classes = className?.split( ' ' ) || [];

		// The ID of the previous version of the block
		// didn't have the `wp-block-comments` class,
		// so we need to remove it here in order to mimic it.
		const newClasses = classes?.filter(
			( cls ) => cls !== 'wp-block-comments'
		);
		const newBlockProps = {
			...blockProps,
			className: newClasses.join( ' ' ),
		};

		return (
			<Tag { ...newBlockProps }>
				<InnerBlocks.Content />
			</Tag>
		);
	},
};

export default [ v1 ];
