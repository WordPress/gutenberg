/**
 * Script module of the `wp_template_part` collection:
 * `@wordpress/core-actions/wp_template_part`.
 *
 * The actions template parts have on top of the defaults. Its default export
 * maps the id of each action to the action.
 */

import type { Action } from '@wordpress/dataviews';
import duplicateTemplatePart from './duplicate-template-part/action';

const actions = {
	'duplicate-template-part': duplicateTemplatePart,
} satisfies Record< string, Action< any > >;

export default actions;
