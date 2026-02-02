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

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

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

		if (
			( context === 'list-view' || context === 'breadcrumb' ) &&
			customName
		) {
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

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'image',
			label: __( 'Image' ),
			type: 'media',
			Edit: {
				control: 'media', // TODO: replace with custom component
				allowedTypes: [ 'image' ],
				multiple: false,
			},
			getValue: ( { item } ) => ( {
				id: item.id,
				url: item.url,
				alt: item.alt,
				caption: item.caption,
			} ),
			setValue: ( { value } ) => ( {
				id: value.id,
				url: value.url,
				alt: value.alt,
				caption: value.caption,
			} ),
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'url',
			Edit: 'link', // TODO: replace with custom component
			getValue: ( { item } ) => ( {
				url: item.href,
				rel: item.rel,
				linkTarget: item.linkTarget,
			} ),
			setValue: ( { value } ) => ( {
				href: value.url,
				rel: value.rel,
				linkTarget: value.linkTarget,
			} ),
		},
		{
			id: 'caption',
			label: __( 'Caption' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
		{
			id: 'alt',
			label: __( 'Alt text' ),
			type: 'text',
		},
	];
	settings[ formKey ] = {
		fields: [ 'image', 'link', 'caption', 'alt' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
