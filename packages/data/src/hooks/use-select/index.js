/**
 * WordPress dependencies
 */
import { useEffect, useState, useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * Internal dependencies
 */
import { RegistryContext } from '../../components/registry-provider';

/**
 * A factory returning a enhanced selector as a custom hook.
 *
 * @param {function} subscribe  The subscribe function for the current registry.
 * @param {function} selector   The selector being enhanced.
 *
 * @return {function} The enhanced selector
 */
const selectorHookFactory = ( subscribe, selector ) => ( ...args ) => {
	const [ result, setResult ] = useState( null );
	useEffect( () => {
		const unsubscribe = subscribe( () => {
			setResult( selector( ...args ) );
		} );
		return () => unsubscribe();
	}, [ ...args, subscribe, selector ] );
	return result;
};

/**
 * A custom hook used for retrieving enhanced selector hooks from the given
 * store.
 *
 * @param {string} store  The store from which to retrieve the selectors.
 *
 * @return {Object} A collection of enhanced selectors
 */
export default function useSelect( store ) {
	const registry = useContext( RegistryContext );
	const selectorHooks = {};
	forEach( registry.select( store ), ( selector, selectorName ) => {
		selectorHooks[ selectorName ] = selectorHookFactory(
			registry.subscribe,
			selector
		);
	} );
	return selectorHooks;
}
