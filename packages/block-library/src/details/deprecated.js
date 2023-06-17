/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

// Deprecation for blocks that also stores the contents of the summary element as a comment delimiter.
const v0 = {
	attributes: {
		showContent: {
			type: 'boolean',
			default: false,
		},
		summary: {
			type: 'string',
		},
	},
	save( { attributes } ) {
		const { showContent } = attributes;
		const summary = attributes.summary ? attributes.summary : 'Details';
		const blockProps = useBlockProps.save();

		return (
			<details { ...blockProps } open={ showContent }>
				<summary>
					<RichText.Content value={ summary } />
				</summary>
				<InnerBlocks.Content />
			</details>
		);
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v0 ];
