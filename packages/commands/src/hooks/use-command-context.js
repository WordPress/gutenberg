/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * Sets the active context of the command palette
 *
 * @param {string} context Context to set.
 */
export default function useCommandContext( context ) {
	const { getContext } = useSelect( commandsStore );
	const initialContext = useRef( getContext() );
	const { setContext } = unlock( useDispatch( commandsStore ) );

	useEffect( () => {
		setContext( context );
	}, [ context, setContext ] );

	// This effects ensures that on unmount, we restore the context
	// that was set before the component actually mounts.
	useEffect( () => {
		const initialContextRef = initialContext.current;
		return () => setContext( initialContextRef );
	}, [ setContext ] );
}
