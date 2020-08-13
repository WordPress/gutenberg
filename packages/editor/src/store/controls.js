/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Returns a control descriptor signalling to subscribe to the registry and
 * resolve the control promise only when the next state change occurs.
 *
 * @return {Object} Control descriptor.
 */
export function awaitNextStateChange() {
	return { type: 'AWAIT_NEXT_STATE_CHANGE' };
}

/**
 * Returns a control descriptor signalling to resolve with the current data
 * registry.
 *
 * @return {Object} Control descriptor.
 */
export function getRegistry() {
	return { type: 'GET_REGISTRY' };
}

/**
 * Function returning a sessionStorage key to set or retrieve a given post's
 * automatic session backup.
 *
 * Keys are crucially prefixed with 'wp-autosave-' so that wp-login.php's
 * `loggedout` handler can clear sessionStorage of any user-private content.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/6dad32d2aed47e6c0cf2aee8410645f6d7aba6bd/src/wp-login.php#L103
 *
 * @param {string}  postId     Post ID.
 * @param {boolean} isPostNew  Whether post new.
 * @return {string}            sessionStorage key
 */
function postKey( postId, isPostNew ) {
	return `wp-autosave-block-editor-post-${
		isPostNew ? 'auto-draft' : postId
	}`;
}

export function localAutosaveGet( postId, isPostNew ) {
	return window.sessionStorage.getItem( postKey( postId, isPostNew ) );
}

export function localAutosaveSet( postId, isPostNew, title, content, excerpt ) {
	window.sessionStorage.setItem(
		postKey( postId, isPostNew ),
		JSON.stringify( {
			post_title: title,
			content,
			excerpt,
		} )
	);
}

export function localAutosaveClear( postId, isPostNew ) {
	window.sessionStorage.removeItem( postKey( postId, isPostNew ) );
}

const controls = {
	AWAIT_NEXT_STATE_CHANGE: createRegistryControl( ( registry ) => () =>
		new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				unsubscribe();
				resolve();
			} );
		} )
	),
	GET_REGISTRY: createRegistryControl( ( registry ) => () => registry ),
	LOCAL_AUTOSAVE_SET( { postId, isPostNew, title, content, excerpt } ) {
		localAutosaveSet( postId, isPostNew, title, content, excerpt );
	},
};

export default controls;
