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
 * @param {string} postId  Post ID.
 * @return {string}        sessionStorage key
 */
function postKey( postId ) {
	return `wp-autosave-block-editor-post-${ postId }`;
}

export function localAutosaveGet( postId ) {
	return window.sessionStorage.getItem( postKey( postId ) );
}

export function localAutosaveSet( postId, title, content, excerpt ) {
	window.sessionStorage.setItem( postKey( postId ), JSON.stringify( {
		post_title: title,
		content,
		excerpt,
	} ) );
}

export function localAutosaveClear( postId ) {
	window.sessionStorage.removeItem( postKey( postId ) );
}

const controls = {
	AWAIT_NEXT_STATE_CHANGE: createRegistryControl(
		( registry ) => () => new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				unsubscribe();
				resolve();
			} );
		} )
	),
	GET_REGISTRY: createRegistryControl( ( registry ) => () => registry ),
	LOCAL_AUTOSAVE_SET( { postId, title, content, excerpt } ) {
		localAutosaveSet( postId, title, content, excerpt );
	},
};

export default controls;
