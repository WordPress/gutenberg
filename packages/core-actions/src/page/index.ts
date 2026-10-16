/**
 * Script module of the `page` collection: `@wordpress/core-actions/page`.
 *
 * The actions pages have on top of the defaults. Its default export maps the
 * id of each action to its JavaScript parts, which the client merges into the
 * action the server registers, see the `post_type_supports` module.
 */

import type { ActionScriptParts } from '../shared/types';
import setAsHomepage from './set-as-homepage/action';
import setAsPostsPage from './set-as-posts-page/action';

const actions = {
	'set-as-homepage': setAsHomepage,
	'set-as-posts-page': setAsPostsPage,
} satisfies Record< string, ActionScriptParts< any > >;

export default actions;
