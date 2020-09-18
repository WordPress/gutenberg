/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const blockAttributes = {
	content: {
		type: 'string',
		source: 'html',
		selector: 'pre',
		default: '',
	},
	textAlign: {
		type: 'string',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { textAlign, content } = attributes;

			return (
				<RichText.Content
					tagName="pre"
					style={ { textAlign } }
					value={ content }
				/>
			);
		},
	},
];

export default deprecated;
