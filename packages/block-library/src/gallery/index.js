/**
 * WordPress dependencies
 */
import { gallery as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			columns: 2,
		},
		innerBlocks: [
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
				},
			},
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg',
				},
			},
		],
	},
	transforms,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "gallery/editor" */ './edit-wrapper' )
	),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
