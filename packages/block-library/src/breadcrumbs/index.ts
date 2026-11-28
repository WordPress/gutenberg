import { breadcrumbs } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { BreadcrumbsAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< BreadcrumbsAttributes >[ 'settings' ] = {
	icon: breadcrumbs,
	example: {},
	edit,
};

export const init = () =>
	initBlock( {
		name,
		metadata:
			metadata as BlockModule< BreadcrumbsAttributes >[ 'metadata' ],
		settings,
	} );
