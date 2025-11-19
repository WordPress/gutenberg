/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			sizeSlug: 'large',
			url: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
			// translators: Caption accompanying an image of the Mont Blanc, which serves as an example for the Image block.
			caption: __( 'Mont Blanc appears—still, snowy, and serene.' ),
		},
	},
	__experimentalLabel( attributes, { context } ) {
		const customName = attributes?.metadata?.name;

		if ( context === 'list-view' && customName ) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			const { caption, alt, url } = attributes;

			if ( ! url ) {
				return __( 'Empty' );
			}

			if ( ! alt ) {
				return caption || '';
			}

			// This is intended to be read by a screen reader.
			// A period simply means a pause, no need to translate it.
			return alt + ( caption ? '. ' + caption : '' );
		}
	},
	getEditWrapperProps( attributes ) {
		return {
			'data-align': attributes.align,
		};
	},
	transforms,
	edit,
	save,
	deprecated,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			label: __( 'Image' ),
			type: 'Media',
			shownByDefault: true,
			mapping: {
				id: 'id',
				src: 'url',
				caption: 'caption',
				alt: 'alt',
			},
			args: {
				allowedTypes: [ 'image' ],
				multiple: false,
			},
		},
		{
			label: __( 'Link' ),
			type: 'Link',
			shownByDefault: false,
			mapping: {
				href: 'href',
				rel: 'rel',
				target: 'linkTarget',
				destination: 'linkDestination',
			},
		},
		{
			label: __( 'Caption' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'caption',
			},
		},
		{
			label: __( 'Alt text' ),
			type: 'PlainText',
			shownByDefault: false,
			mapping: {
				value: 'alt',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
