/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { cover as icon } from '@wordpress/icons';
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
import variations from './variations';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			customOverlayColor: '#065174',
			dimRatio: 40,
			url: 'https://s.w.org/images/core/5.3/Windbuchencom.jpg',
			style: {
				typography: {
					fontSize: 48,
				},
				color: {
					text: 'white',
				},
			},
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: `<strong>${ __( 'Snow Patrol' ) }</strong>`,
					style: {
						typography: {
							textAlign: 'center',
						},
					},
				},
			},
		],
	},
	transforms,
	save,
	edit,
	deprecated,
	variations,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'background',
			label: __( 'Background' ),
			type: 'media',
			Edit: {
				control: 'media', // TODO: replace with custom component
				// TODO - How to support custom gradient?
				// Build it into Media, or use a custom control?
				allowedTypes: [ 'image', 'video' ],
				multiple: false,
				useFeaturedImage: true,
			},
			getValue: ( { item } ) => ( {
				id: item.id,
				url: item.url,
				alt: item.alt,
				mediaType: item.backgroundType,
				featuredImage: item.useFeaturedImage,
			} ),
			setValue: ( { value } ) => ( {
				id: value.id,
				url: value.url,
				alt: value.alt,
				mediaType: value.backgroundType,
				useFeaturedImage: value.featuredImage,
			} ),
		},
	];
	settings[ formKey ] = {
		fields: [ 'background' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
