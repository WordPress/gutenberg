import type { FieldsScriptParts } from '../../types';
import SlugEdit from './edit';
import SlugView from './view';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';

/**
 * The JavaScript parts of the slug field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithSlug >[ string ] = {
	// Decoded, so sorting, searching, and other consumers see the slug as the
	// user reads it, not percent-encoded.
	getValue: ( { item } ) => getSlug( item ),
	Edit: SlugEdit,
	render: SlugView,
	// The REST API only exposes `permalink_template` for viewable public
	// post types, so posts without a permalink hide the field.
	isVisible: ( item ) => !! item.link && !! item.permalink_template,
};
