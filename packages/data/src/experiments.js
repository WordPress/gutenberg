/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/data'
	);

/**
 * Enables registering private actions on a store without exposing
 * them to the public API.
 *
 * Use it with the store descriptor object:
 *
 * ```js
 * const store = createReduxStore( 'my-store', { ... } );
 * registerPrivateSelectors( store, {
 *     __experimentalSelector: ( state ) => state.value,
 * } );
 * ```
 *
 * Once the selectors are registered, they can be accessed using the
 * `unlock()` utility:
 *
 * ```js
 * unlock( registry.select( blockEditorStore ) ).__experimentalSelector();
 * ```
 *
 * Note the object returned by select() has the good old public methods,
 * but the private API participants can also "unlock" it to access the private
 * parts.
 *
 * @example
 *
 * ```js
 * // In the package exposing the private selectors:
 *
 * import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';
 * export const { lock, unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules( /* ... *\/ );
 *
 * import { experiments as dataExperiments } from '@wordpress/data';
 * const { registerPrivateSelectors } = unlock( dataExperiments );
 *
 * const store = registerStore( 'my-store', { /* ... *\/ } );
 * registerPrivateSelectors( store, {
 *     __experimentalSelector: ( state ) => state.value,
 * } );
 *
 * // In the package using the private selectors:
 * import { store as blockEditorStore } from '@wordpress/block-editor';
 * unlock( registry.select( blockEditorStore ) ).__experimentalSelector();
 *
 * // Or in a React component:
 * useSelect( ( select ) => ( {
 *     parent: privateOf( select( blockEditorStore ) ).__experimentalSelector();
 * } ) );
 * ```
 *
 * @param {Object} store     The store descriptor to register the private selectors on.
 * @param {Object} selectors The private selectors to register in a { name: ( state ) => {} } format.
 */
export function registerPrivateSelectors( store, selectors ) {
	lock( store, { selectors } );
}

/**
 * Enables registering private actions on a store without exposing
 * them to the public API.
 *
 * Use it with the store descriptor object:
 *
 * ```js
 * const store = createReduxStore( 'my-store', { ... } );
 * registerPrivateActions( store, {
 *     __experimentalAction: ( state ) => state.value,
 * } );
 * ```
 *
 * Once the actions are registered, they can be accessed using the
 * `unlock()` utility:
 *
 * ```js
 * unlock( registry.select( blockEditorStore ) ).__experimentalAction();
 * ```
 *
 * Note the object returned by select() has the good old public methods,
 * but the private API participants can also "unlock" it to access the private
 * parts.
 *
 * @example
 *
 * ```js
 * // In the package exposing the private actions:
 *
 * import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';
 * export const { lock, unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules( /* ... *\/ );
 *
 * import { experiments as dataExperiments } from '@wordpress/data';
 * const { registerPrivateActions } = unlock( dataExperiments );
 *
 * const store = registerStore( 'my-store', { /* ... *\/ } );
 * registerPrivateActions( store, {
 *     __experimentalAction: ( state ) => state.value,
 * } );
 *
 * // In the package using the private actions:
 * import { store as blockEditorStore } from '@wordpress/block-editor';
 * unlock( registry.dispatch( blockEditorStore ) ).__experimentalAction();
 *
 * // Or in a React component:
 * useDispatch( ( dispatch ) => ( {
 *     parent: privateOf( dispatch( blockEditorStore ) ).__experimentalAction();
 * } ) );
 * ```
 *
 * @param {Object} store   The store descriptor to register the private actions on.
 * @param {Object} actions The private actions to register in a { name: ( state ) => {} } format.
 */
export function registerPrivateActions( store, actions ) {
	lock( store, { actions } );
}

/**
 * The experimental APIs exposed by the `@wordpress/data` package.
 * Only available to core packages. These APIs are not stable and may
 * change without notice. Do not use outside of core.
 *
 * @example
 *
 * ```js
 * import { unlock } from '../experiments';
 * import { experiments as dataExperiments } from '@wordpress/data';
 * const { registerPrivateSelectors } = unlock( dataExperiments );
 *
 * import { store as blockEditorStore } from './store';
 * import { __unstableSelectionHasUnmergeableBlock } from './store/selectors';
 * registerPrivateSelectors( store, {
 * __experimentalHasContentRoleAttribute
 * } );
 * ```
 */
export const experiments = {};
lock( experiments, {
	registerPrivateSelectors,
	registerPrivateActions,
} );
