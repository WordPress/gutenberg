/**
 * Script module of the `wp_block` collection:
 * `@wordpress/core-actions/wp_block`.
 *
 * The actions patterns have on top of the defaults. Its default export maps
 * the id of each action to the action.
 */

import type { Action } from '@wordpress/dataviews';
import duplicatePattern from './duplicate-pattern/action';
import exportPattern from './export-pattern/action';

const actions: Record< string, Action< any > > = {
	'duplicate-pattern': duplicatePattern,
	'export-pattern': exportPattern,
};

export default actions;
