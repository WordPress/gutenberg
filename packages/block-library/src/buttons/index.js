/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { buttons as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import transforms from './transforms';

import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/button',
				attributes: { text: __( 'Find out more' ) },
			},
			{
				name: 'core/button',
				attributes: { text: __( 'Contact us' ) },
			},
		],
	},
	deprecated,
	transforms,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "buttons/editor" */ './edit' )
	),
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
