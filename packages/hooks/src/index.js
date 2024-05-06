/**
 * Internal dependencies
 */
import createHooks from './createHooks';

/** @typedef {(...args: any[])=>any} Callback */

/**
 * @typedef Handler
 * @property {Callback} callback  The callback
 * @property {string}   namespace The namespace
 * @property {number}   priority  The namespace
 */

/**
 * @typedef Hook
 * @property {Handler[]} handlers Array of handlers
 * @property {number}    runs     Run counter
 */

/**
 * @typedef Current
 * @property {string} name         Hook name
 * @property {number} currentIndex The index
 */

/**
 * @typedef {Record<string|symbol, Hook> & {__current: Current[]}} Store
 */

/**
 * @typedef {'actions' | 'filters'} StoreKey
 */

/**
 * @typedef {import('./createHooks').Hooks} Hooks
 */

export const defaultHooks = createHooks();

const {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
} = defaultHooks;

export {
	createHooks,
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
};

import { privateApis as hooksPrivateApis } from './private-apis';
import { unlock } from './lock-unlock';

/**
 * This will fire whenever a post is renamed, regardless of which UI we're
 * accessing from.
 */
addAction(
	unlock( hooksPrivateApis ).privateHooksMap.get( 'postActions.renamePost' ),
	'my/handle-rename-post',
	function () {
		// eslint-disable-next-line no-console
		console.log( 'Post renamed in postActions.renamePost' );
	}
);

/**
 * This will fire only when accessing from PagePages
 * (/wp-admin/site-editor.php?path=%2Fpage&layout=table)
 */
addAction(
	unlock( hooksPrivateApis ).privateHooksMap.get( 'pagePages.renamePost' ),
	'my/handle-rename-post',
	function () {
		// eslint-disable-next-line no-console
		console.log( 'Post renamed in pagePages.renamePost' );
	}
);

/**
 * That specificity helps to implement routing. Note that the contextual
 * history object is passed via the hook.
 */
addAction(
	unlock( hooksPrivateApis ).privateHooksMap.get( 'pagePages.editPost' ),
	'my/handle-edit-post',
	function ( items, history ) {
		const post = items[ 0 ];
		// eslint-disable-next-line no-console
		console.log( `Editing post ${ post?.id }` );
		history.push( {
			postId: post.id,
			postType: post.type,
			canvas: 'edit',
		} );
	}
);

export * from './private-apis';
