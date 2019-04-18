/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getLevelFromHeadingNodeName } from './shared';

const supports = {
	className: false,
	anchor: true,
};

const blockAttributes = {
	align: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: 'h1,h2,h3,h4,h5,h6',
		default: '',
	},
	placeholder: {
		type: 'string',
	},
};

const deprecated = [
	{
		supports,
		attributes: {
			...blockAttributes,
			nodeName: {
				type: 'string',
				source: 'property',
				selector: 'h1,h2,h3,h4,h5,h6',
				property: 'nodeName',
				default: 'H2',
			},
		},
		migrate( attributes ) {
			const { nodeName, ...migratedAttributes } = attributes;

			return {
				...migratedAttributes,
				level: getLevelFromHeadingNodeName( nodeName ),
			};
		},
		save( { attributes } ) {
			const { align, nodeName, content } = attributes;

			return (
				<RichText.Content
					tagName={ nodeName.toLowerCase() }
					style={ { textAlign: align } }
					value={ content }
				/>
			);
		},
	},
];

export default deprecated;
