/**
 * Script module of the `post_type_supports` collection:
 * `@wordpress/core-actions/post_type_supports`.
 *
 * The default actions of every post type, each registered on the post types
 * that support it or on every post type, see `registerPostTypeSchema()` in
 * `@wordpress/editor`. Its default export maps the id of each action to the
 * action.
 */

import type { Action } from '@wordpress/dataviews';
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

const actions: Record< string, Action< any > > = {
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
};

export default actions;
