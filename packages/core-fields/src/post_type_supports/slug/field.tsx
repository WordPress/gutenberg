import type { FieldsScriptParts } from '@wordpress/fields-loader';
import SlugEdit from './edit';
import SlugView from './view';
import type { PostWithSlug } from './types';

/**
 * The JavaScript parts of the slug field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithSlug >[ string ] = {
	Edit: SlugEdit,
	render: SlugView,
	// The REST API only exposes `permalink_template` for viewable public
	// post types, so posts without a permalink hide the field.
	isVisible: ( item ) => !! item.link && !! item.permalink_template,
};
