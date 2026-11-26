import { widget as icon } from '@wordpress/icons';
import type { BlockConfiguration } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';
import type { LegacyWidgetAttributes } from './types';

export type { LegacyWidgetAttributes, RawInstance } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: Partial< BlockConfiguration< LegacyWidgetAttributes > > =
	{
		icon,
		edit,
		transforms,
	};
