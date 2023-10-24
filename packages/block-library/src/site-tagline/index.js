/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import icon from './icon';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "site-tagline/editor" */ './edit' )
	),
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
