/**
 * Script module of the `post_type_supports` collection:
 * `@wordpress/core-actions/post_type_supports`.
 *
 * The default actions of every post type, each registered on the post types
 * that support it or on every post type. The data of each action is in its
 * `action.php`, and `index.php` registers the actions; the client reads them
 * from the `wp/v2/entity-actions` route. What cannot be serialized (callbacks and
 * components) is in the `action.tsx` of the action: the client imports this
 * module on demand and merges each entry into the action with the same id.
 */

import type { ActionScriptParts } from '../shared/types';
import deletePost from './delete-post/action';
import duplicatePost from './duplicate-post/action';
import moveToTrash from './move-to-trash/action';
import orderPages from './order-pages/action';
import permanentlyDelete from './permanently-delete/action';
import renamePost from './rename-post/action';
import resetPost from './reset-post/action';
import restore from './restore/action';
import viewPost from './view-post/action';
import viewPostRevisions from './view-post-revisions/action';

const actions = {
	'delete-post': deletePost,
	'duplicate-post': duplicatePost,
	'move-to-trash': moveToTrash,
	'order-pages': orderPages,
	'permanently-delete': permanentlyDelete,
	'rename-post': renamePost,
	'reset-post': resetPost,
	restore,
	'view-post': viewPost,
	'view-post-revisions': viewPostRevisions,
} satisfies Record< string, ActionScriptParts< any > >;

export default actions;
