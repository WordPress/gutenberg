/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	lazyEdit: () =>
		import(
			/* webpackChunkName: "post-navigation-link/editor" */ './edit'
		),
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
