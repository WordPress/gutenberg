/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';

import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	lazyEdit: () =>
		import( /* webpackChunkName: "form-submit-button/editor" */ './edit' ),
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
