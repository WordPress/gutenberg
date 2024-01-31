/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const deprecated = [
	{
		supports: {
			anchor: true,
			className: false,
			color: {
				gradients: true,
				link: true,
				__experimentalDefaultControls: {
					background: true,
					text: true,
					link: true,
				},
			},
			spacing: {
				margin: true,
				padding: true,
			},
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
				__experimentalTextDecoration: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalLetterSpacing: true,
				__experimentalTextTransform: true,
				__experimentalDefaultControls: {
					fontSize: true,
				},
			},
			__experimentalSelector: 'form',
		},
		attributes: {
			submissionMethod: {
				type: 'string',
				default: 'email',
			},
			method: {
				type: 'string',
				default: 'post',
			},
			action: {
				type: 'string',
			},
			email: {
				type: 'string',
			},
		},
		save( { attributes } ) {
			const blockProps = useBlockProps.save();
			const { submissionMethod } = attributes;

			return (
				<form
					{ ...blockProps }
					className="wp-block-form"
					encType={
						submissionMethod === 'email' ? 'text/plain' : null
					}
				>
					<InnerBlocks.Content />
				</form>
			);
		},
	},
];

export default deprecated;
