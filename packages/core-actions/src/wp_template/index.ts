/**
 * Script module of the `wp_template` collection:
 * `@wordpress/core-actions/wp_template`.
 *
 * The actions templates have on top of the defaults. Its default export maps
 * the id of each action to its JavaScript parts, which the client merges into
 * the action the server registers, see the `post_type_supports` module.
 */

import type { ActionScriptParts } from '../shared/types';
import duplicateTemplate from './duplicate-template/action';

const actions = {
	'duplicate-template': duplicateTemplate,
} satisfies Record< string, ActionScriptParts< any > >;

export default actions;
