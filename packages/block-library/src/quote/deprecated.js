/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const blockAttributes = {
	value: {
		type: 'string',
		source: 'html',
		selector: 'blockquote',
		multiline: 'p',
		default: '',
	},
	citation: {
		type: 'string',
		source: 'html',
		selector: 'cite',
		default: '',
	},
	align: {
		type: 'string',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { align, value, citation } = attributes;

			return (
				<blockquote style={ { textAlign: align ? align : null } }>
					<RichText.Content multiline value={ value } />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			citation: {
				type: 'string',
				source: 'html',
				selector: 'footer',
				default: '',
			},
			style: {
				type: 'number',
				default: 1,
			},
		},

		save( { attributes } ) {
			const { align, value, citation, style } = attributes;

			return (
				<blockquote
					className={ `blocks-quote-style-${ style }` }
					style={ { textAlign: align ? align : null } }
				>
					<RichText.Content multiline value={ value } />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="footer" value={ citation } />
					) }
				</blockquote>
			);
		},
	},
];

export default deprecated;
