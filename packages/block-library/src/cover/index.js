/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { cover as icon } from '@wordpress/icons';

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

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			customOverlayColor: '#065174',
			dimRatio: 40,
			url: 'https://s.w.org/images/core/5.3/Windbuchencom.jpg',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( '<strong>Snow Patrol</strong>' ),
					align: 'center',
					style: {
						typography: {
							fontSize: 48,
						},
						color: {
							text: 'white',
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

export const init = () => initBlock( { name, metadata, settings } );
