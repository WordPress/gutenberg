/**
 * Script module of the `wp_template_part` collection:
 * `@wordpress/core-actions/wp_template_part`.
 *
 * The actions template parts have on top of the defaults. Their data is
 * declared in `src/index.php`; the default export maps the id of each action
 * to its JavaScript parts.
 */

import type { ActionsScriptParts } from '../types';
import duplicateTemplatePart from './duplicate-template-part/action';

const actions: ActionsScriptParts = {
	'duplicate-template-part': duplicateTemplatePart,
};

export default actions;
