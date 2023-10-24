/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "pattern/editor" */ './edit' )
	),
};

export const init = () => initBlock( { name, metadata, settings } );
