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
	supports: {
		align: [ 'wide', 'full' ],
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		__experimentalBorder: {
			color: true,
			width: true,
			style: true,
		},
		html: false,
		spacing: {
			margin: true,
			padding: true,
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
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
