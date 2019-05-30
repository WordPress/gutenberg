/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name, attributes: blockAttributes } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Quote' ),
	description: __( 'Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar' ),
	icon,
	keywords: [ __( 'blockquote' ) ],
	styles: [
		{ name: 'default', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: 'large', label: _x( 'Large', 'block style' ) },
	],
	transforms,
	edit,
	save,
	merge( attributes, { value, citation } ) {
		if ( ! value || value === '<p></p>' ) {
			return {
				...attributes,
				citation: attributes.citation + citation,
			};
		}

		return {
			...attributes,
			value: attributes.value + value,
			citation: attributes.citation + citation,
		};
	},
	deprecated: [
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
	],
};
