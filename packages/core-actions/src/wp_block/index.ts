/**
 * Script module of the `wp_block` collection:
 * `@wordpress/core-actions/wp_block`.
 *
 * The actions patterns have on top of the defaults. Its default export maps
 * the id of each action to its JavaScript parts, which the client merges into
 * the action the server registers, see the `post_type_supports` module.
 */

import type { ActionScriptParts } from '../shared/types';
import duplicatePattern from './duplicate-pattern/action';
import exportPattern from './export-pattern/action';

const actions = {
	'duplicate-pattern': duplicatePattern,
	'export-pattern': exportPattern,
} satisfies Record< string, ActionScriptParts< any > >;

export default actions;
