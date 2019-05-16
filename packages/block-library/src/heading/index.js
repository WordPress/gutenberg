/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { getLevelFromHeadingNodeName } from './shared';

const { name, attributes: schema } = metadata;

export { metadata, name };

const supports = {
	className: false,
	anchor: true,
};

export const settings = {
	title: __( 'Heading' ),
	description: __( 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.' ),
	icon,
	keywords: [ __( 'title' ), __( 'subtitle' ) ],
	supports,
	transforms,
	deprecated: [
		{
			supports,
			attributes: {
				...omit( schema, [ 'level' ] ),
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
	],
	merge( attributes, attributesToMerge ) {
		return {
			content: ( attributes.content || '' ) + ( attributesToMerge.content || '' ),
		};
	},
	edit,
	save,
};
