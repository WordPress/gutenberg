/**
 * WordPress dependencies
 */
import { classic as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

export const init = () => {
	// Only expose the block in the inserter if the current post actually needs
	// a classic block.
	const supports = {
		...metadata.supports,
		inserter: !! window?.__needsClassicBlock,
	};
	return initBlock( { name, metadata, settings: { ...settings, supports } } );
};
