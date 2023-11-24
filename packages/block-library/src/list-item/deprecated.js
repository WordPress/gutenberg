/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks, useBlockProps } from '@wordpress/block-editor';

// Version without block support 'className: true'.
const v1 = {
	attributes: {
		placeholder: {
			type: 'string',
		},
		content: {
			type: 'string',
			source: 'html',
			selector: 'li',
			default: '',
			__experimentalRole: 'content',
		},
	},
	supports: {
		className: false,
		__experimentalSelector: 'li',
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
		return (
			<li { ...useBlockProps.save() }>
				<RichText.Content value={ attributes.content } />
				<InnerBlocks.Content />
			</li>
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
export default [ v1 ];
