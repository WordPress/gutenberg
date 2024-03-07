/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import metadata from './block.json';
import save from './save';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	deprecated,
	lazyEdit: () =>
		import( /* webpackChunkName: "form-input/editor" */ './edit' ),
	save,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
