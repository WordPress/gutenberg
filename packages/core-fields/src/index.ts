/**
 * Script module providing the JavaScript parts of the fields WordPress core
 * registers on the server.
 *
 * The serializable part of these fields (id, type, label, elements, filter
 * operators…) is declared in PHP, see `_gutenberg_register_posttype_supports_fields()`
 * in `lib/compat/wordpress-7.2/fields-api.php`, and reaches the client through
 * the `wp/v2/fields` REST route. What cannot be serialized (callbacks and
 * components) ships here: the client imports this module on demand and merges
 * each entry into the field with the same id.
 *
 * Only the fields with JavaScript parts need an entry. The comment status and
 * notes fields are plain data and have none.
 */
import type { FieldsScriptParts } from '@wordpress/entity-fields';
import { authorField } from '@wordpress/fields';

const coreFields: FieldsScriptParts = {
	author: {
		getElements: authorField.getElements,
		setValue: authorField.setValue,
		render: authorField.render,
		isVisible: authorField.isVisible,
	},
};

export default coreFields;
