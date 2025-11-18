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

const { fieldsKey } = unlock( blocksPrivateApis );

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
					align: 'center',
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

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			label: __( 'Background' ),
			type: 'Media',
			shownByDefault: true,
			mapping: {
				type: 'backgroundType',
				id: 'id',
				src: 'url',
				alt: 'alt',
				featuredImage: 'useFeaturedImage',
			},
			args: {
				// TODO - How to support custom gradient?
				// Build it into Media, or use a custom control?
				allowedTypes: [ 'image', 'video' ],
				multiple: false,
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
