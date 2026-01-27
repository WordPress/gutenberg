/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import { isWithinNavigationOverlay } from '../utils/is-within-overlay';
import edit from './edit';
import metadata from './block.json';
import icon from './icon';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
};

export const init = () => {
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/navigation-overlay-close/restrict-to-overlay-template-parts',
		( canInsert, blockType ) => {
			if ( blockType.name !== 'core/navigation-overlay-close' ) {
				return canInsert;
			}

			if ( ! canInsert ) {
				return canInsert;
			}

			return isWithinNavigationOverlay();
		}
	);

	return initBlock( { name, metadata, settings } );
};
