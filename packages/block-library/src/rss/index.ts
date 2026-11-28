import { rss as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { RSSAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< RSSAttributes >[ 'settings' ] = {
	icon,
	example: {
		attributes: {
			feedURL: 'https://wordpress.org',
		},
	},
	edit,
};

export const init = () =>
	initBlock( {
		name,
		metadata,
		settings,
	} );
