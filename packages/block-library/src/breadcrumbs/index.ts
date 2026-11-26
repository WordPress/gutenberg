import { breadcrumbs } from '@wordpress/icons';
import type { BlockConfiguration } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { BreadcrumbsAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: Partial< BlockConfiguration< BreadcrumbsAttributes > > =
	{
		icon: breadcrumbs,
		example: {},
		edit,
	};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as BlockModule[ 'metadata' ],
		settings: settings as BlockModule[ 'settings' ],
	} );
