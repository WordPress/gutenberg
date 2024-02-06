/**
 * WordPress dependencies
 */
import { group as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';

import metadata from './block.json';
import save from './save';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () =>
		import(
			/* webpackChunkName: "form-submission-notification/editor" */ './edit'
		),
	save,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
