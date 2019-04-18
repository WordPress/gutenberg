/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const deprecated = [
	{
		supports: {
			className: false,
		},
		attributes: {
			values: {
				type: 'string',
				source: 'html',
				selector: 'ol,ul',
				multiline: 'li',
				default: '',
			},
			nodeName: {
				type: 'string',
				source: 'property',
				selector: 'ol,ul',
				property: 'nodeName',
				default: 'UL',
			},
		},
		migrate( attributes ) {
			const { nodeName, ...migratedAttributes } = attributes;

			return {
				...migratedAttributes,
				ordered: 'OL' === nodeName,
			};
		},
		save( { attributes } ) {
			const { nodeName, values } = attributes;

			return (
				<RichText.Content
					tagName={ nodeName.toLowerCase() }
					value={ values }
				/>
			);
		},
	},
];

export default deprecated;
