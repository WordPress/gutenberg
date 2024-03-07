/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';
import variations from './variations';
import deprecated from './deprecated';
import { embedContentIcon } from './icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: embedContentIcon,
	lazyEdit: () => import( /* webpackChunkName: "embed/editor" */ './edit' ),
	save,
	transforms,
	variations,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
