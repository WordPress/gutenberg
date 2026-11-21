import { widget as icon } from '@wordpress/icons';
import type { BlockConfiguration } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

export interface LegacyWidgetAttributes extends Record< string, unknown > {
	id?: string | null;
	idBase?: string | null;
	instance?: Record< string, unknown > | null;
}

const { name } = metadata;
export { metadata, name };

export const settings: Partial< BlockConfiguration< LegacyWidgetAttributes > > =
	{
		icon,
		edit,
		transforms,
	};
