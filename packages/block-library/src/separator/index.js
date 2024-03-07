/**
 * WordPress dependencies
 */
import { separator as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';

import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import deprecated from './deprecated';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			customColor: '#065174',
			className: 'is-style-wide',
		},
	},
	transforms,
	lazyEdit: () =>
		import( /* webpackChunkName: "separator/editor" */ './edit' ),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
