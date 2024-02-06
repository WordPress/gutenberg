/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	lazyEdit: () => import( /* webpackChunkName: "pattern/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
