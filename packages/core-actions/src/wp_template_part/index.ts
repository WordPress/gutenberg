/**
 * Script module of the `wp_template_part` collection:
 * `@wordpress/core-actions/wp_template_part`.
 *
 * The actions template parts have on top of the defaults. Its default export
 * maps the id of each action to its JavaScript parts, which the client merges
 * into the action the server registers, see the `post_type_supports` module.
 */

import type { ActionScriptParts } from '../shared/types';
import duplicateTemplatePart from './duplicate-template-part/action';

const actions = {
	'duplicate-template-part': duplicateTemplatePart,
} satisfies Record< string, ActionScriptParts< any > >;

export default actions;
