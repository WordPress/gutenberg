/**
 * Script module of the `wp_block` collection:
 * `@wordpress/core-actions/wp_block`.
 *
 * The actions patterns have on top of the defaults. Their data is declared in
 * `src/index.php`; the default export maps the id of each action to its
 * JavaScript parts.
 */

import type { ActionsScriptParts } from '../types';
import duplicatePattern from './duplicate-pattern/action';
import exportPattern from './export-pattern/action';

const actions: ActionsScriptParts = {
	'duplicate-pattern': duplicatePattern,
	'export-pattern': exportPattern,
};

export default actions;
