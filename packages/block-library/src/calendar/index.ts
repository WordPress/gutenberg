import { calendar as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';
import type { CalendarAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< CalendarAttributes >[ 'settings' ] = {
	icon,
	example: {},
	edit,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
