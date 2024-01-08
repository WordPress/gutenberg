/**
 * WordPress dependencies
 */
import { symbol as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import editV1 from './v1/edit';
import editV2 from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit: window.__experimentalPatternPartialSyncing ? editV2 : editV1,
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );
