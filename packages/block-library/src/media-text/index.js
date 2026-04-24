/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mediaAndText as icon } from '@wordpress/icons';
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
		viewportWidth: 601, // Columns collapse "@media (max-width: 600px)".
		attributes: {
			mediaType: 'image',
			mediaUrl:
				'https://s.w.org/images/core/5.3/Biologia_Centrali-Americana_-_Cantorchilus_semibadius_1902.jpg',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __(
						'The wren<br>Earns his living<br>Noiselessly.'
					),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: __( '— Kobayashi Issa (一茶)' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'media',
			label: __( 'Media' ),
			type: 'media',
			Edit: {
				control: 'media', // TODO: replace with custom component
				allowedTypes: [ 'image', 'video' ],
				multiple: false,
			},
			getValue: ( { item } ) => ( {
				id: item.mediaId,
				url: item.mediaUrl,
				mediaType: item.mediaType,
				link: item.mediaLink,
			} ),
			setValue: ( { value } ) => ( {
				mediaId: value.id,
				mediaUrl: value.url,
				mediaType: value.mediaType,
				mediaLink: value.link,
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
	];
	settings[ formKey ] = {
		fields: [ 'media', 'link' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
