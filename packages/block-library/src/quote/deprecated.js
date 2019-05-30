/**
 * External dependencies
 */
import { omit } from 'lodash';

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
		attributes: {
			...blockAttributes,
			style: {
				type: 'number',
				default: 1,
			},
		},

		migrate( attributes ) {
			if ( attributes.style === 2 ) {
				return {
					...omit( attributes, [ 'style' ] ),
					className: attributes.className ? attributes.className + ' is-style-large' : 'is-style-large',
				};
			}

			return attributes;
		},

		save( { attributes } ) {
			const { align, value, citation, style } = attributes;

			return (
				<blockquote
					className={ style === 2 ? 'is-large' : '' }
					style={ { textAlign: align ? align : null } }
				>
					<RichText.Content multiline value={ value } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
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
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	},
];

export default deprecated;
