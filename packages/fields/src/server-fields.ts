/**
 * Script module providing the JavaScript parts of the post fields registered
 * on the server.
 *
 * The serializable part of these fields (id, type, label, elements, filter
 * operators…) is declared in PHP, see `_gutenberg_register_posttype_supports_fields()`
 * in `lib/compat/wordpress-7.2/fields-api.php`, and reaches the editor through
 * the `wp/v2/fields` REST route. What cannot be serialized (callbacks and
 * components) ships here: the editor imports this module on demand and merges
 * each entry into the field with the same id.
 *
 * Only the fields with JavaScript parts need an entry. The comment status and
 * notes fields are plain data and have none.
 *
 * Built as the `@wordpress/fields/server-fields` script module, see
 * `wpScriptModuleExports` in the package manifest.
 */
import type { Field } from '@wordpress/dataviews';
import authorField from './fields/author';

/**
 * The JavaScript parts of a field, keyed by field id.
 */
type ServerFieldsScriptParts = Record<
	string,
	Partial< Omit< Field< any >, 'id' > >
>;

const serverFields: ServerFieldsScriptParts = {
	author: {
		getElements: authorField.getElements,
		setValue: authorField.setValue,
		render: authorField.render,
		isVisible: authorField.isVisible,
	},
};

export default serverFields;
