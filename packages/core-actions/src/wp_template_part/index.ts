/**
 * Script module of the `wp_template_part` collection:
 * `@wordpress/core-actions/wp_template_part`.
 *
 * The actions template parts have on top of the defaults. Its default export
 * maps the id of each action to the action, a copy of the one
 * `@wordpress/fields` exports.
 */

import type { Action } from '@wordpress/dataviews';
import duplicateTemplatePart from './duplicate-template-part/action';

const actions: Record< string, Action< any > > = {
	'duplicate-template-part': duplicateTemplatePart,
};

export default actions;
