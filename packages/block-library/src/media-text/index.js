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
			mapping: {
				id: 'mediaId',
				mediaType: 'mediaType',
				url: 'mediaUrl',
				link: 'mediaLink',
			},
			args: {
				allowedTypes: [ 'image', 'video' ],
				multiple: false,
			},
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'link',
			mapping: {
				url: 'href',
				rel: 'rel',
				linkTarget: 'linkTarget',
			},
		},
	];
	settings[ formKey ] = {
		fields: [ 'media', 'link' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
