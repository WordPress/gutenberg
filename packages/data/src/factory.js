/**
 * Creates a selector function that takes additional curried argument with the
 * registry `select` function. While a regular selector has signature
 * ```js
 * ( state, ...selectorArgs ) => ( result )
 * ```
 * that allows to select data from the store's `state`, a registry selector
 * has signature:
 * ```js
 * ( select ) => ( state, ...selectorArgs ) => ( result )
 * ```
 * that supports also selecting from other registered stores.
 *
 * @example
 * ```js
 * import { store as coreStore } from '@wordpress/core-data';
 * import { store as editorStore } from '@wordpress/editor';
 *
 * const getCurrentPostId = createRegistrySelector( ( select ) => ( state ) => {
 *   return select( editorStore ).getCurrentPostId();
 * } );
 *
 * const getPostEdits = createRegistrySelector( ( select ) => ( state ) => {
 *   // calling another registry selector just like any other function
 *   const postType = getCurrentPostType( state );
 *   const postId = getCurrentPostId( state );
 *	 return select( coreStore ).getEntityRecordEdits( 'postType', postType, postId );
 * } );
 * ```
 *
 * Note how the `getCurrentPostId` selector can be called just like any other function,
 * (it works even inside a regular non-registry selector) and we don't need to pass the
 * registry as argument. The registry binding happens automatically when registering the selector
 * with a store.
 *
 * @param {Function} registrySelector Function receiving a registry `select`
 *                                    function and returning a state selector.
 *
 * @return {Function} Registry selector that can be registered with a store.
 */
export function createRegistrySelector( registrySelector ) {
	const selectorsByRegistry = new WeakMap();
	// Create a selector function that is bound to the registry referenced by `selector.registry`
	// and that has the same API as a regular selector. Binding it in such a way makes it
	// possible to call the selector directly from another selector.
	const wrappedSelector = ( ...args ) => {
		let selector = selectorsByRegistry.get( wrappedSelector.registry );
		// We want to make sure the cache persists even when new registry
		// instances are created. For example patterns create their own editors
		// with their own core/block-editor stores, so we should keep track of
		// the cache for each registry instance.
		if ( ! selector ) {
			selector = registrySelector( wrappedSelector.registry.select );
			selectorsByRegistry.set( wrappedSelector.registry, selector );
		}
		return selector( ...args );
	};

	/**
	 * Flag indicating that the selector is a registry selector that needs the correct registry
	 * reference to be assigned to `selector.registry` to make it work correctly.
	 * be mapped as a registry selector.
	 *
	 * @type {boolean}
	 */
	wrappedSelector.isRegistrySelector = true;

	return wrappedSelector;
}

/**
 * Creates a control function that takes additional curried argument with the `registry` object.
 * While a regular control has signature
 * ```js
 * ( action ) => ( iteratorOrPromise )
 * ```
 * where the control works with the `action` that it's bound to, a registry control has signature:
 * ```js
 * ( registry ) => ( action ) => ( iteratorOrPromise )
 * ```
 * A registry control is typically used to select data or dispatch an action to a registered
 * store.
 *
 * When registering a control created with `createRegistryControl` with a store, the store
 * knows which calling convention to use when executing the control.
 *
 * @param {Function} registryControl Function receiving a registry object and returning a control.
 *
 * @return {Function} Registry control that can be registered with a store.
 */
export function createRegistryControl( registryControl ) {
	registryControl.isRegistryControl = true;

	return registryControl;
}
