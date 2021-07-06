/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { createBlock, parseWithAttributeSchema } from '@wordpress/blocks';

const blockAttributes = {
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
			style: {
				type: 'number',
				default: 1,
			},
		},

		migrate( attributes ) {
			if ( attributes.style === 2 ) {
				return {
					...omit( attributes, [ 'style' ] ),
					className: attributes.className
						? attributes.className + ' is-style-large'
						: 'is-style-large',
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
	{
		attributes: {
			...blockAttributes,
			value: {
				type: 'string',
				source: 'html',
				selector: 'blockquote',
				multiline: 'p',
				default: '',
			},
		},
		migrate( attributes ) {
			// The old value attribute for quotes can contain:
			// - a single paragraph: "<p>single paragraph</p>"
			// - multiple paragraphs: "<p>first paragraph</p><p>second paragraph</p>"
			const innerBlocks = parseWithAttributeSchema( attributes.value, {
				type: 'array',
				source: 'query',
				selector: 'p',
				query: {
					value: {
						type: 'string',
						source: 'text',
					},
				},
			} ).map( ( { value } ) =>
				createBlock( 'core/paragraph', { content: value } )
			);
			return [ omit( attributes, [ 'value' ] ), innerBlocks ];
		},
		save( { attributes: { value, citation } } ) {
			return (
				<blockquote>
					<RichText.Content multiline value={ value } />
					{ ! RichText.isEmpty( citation ) && (
						<RichText.Content tagName="cite" value={ citation } />
					) }
				</blockquote>
			);
		},
	},
];

export default deprecated;
