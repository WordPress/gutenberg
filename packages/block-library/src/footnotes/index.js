/**
 * WordPress dependencies
 */
import { formatListNumbered as icon } from '@wordpress/icons';
import { registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';

import metadata from './block.json';
import { formatName, format } from './format';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "footnotes/editor" */ './edit' )
	),
};

registerFormatType( formatName, format );

export const init = () => {
	initBlock( { name, metadata, settings } );
};
