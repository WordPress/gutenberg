/**
 * WordPress dependencies
 */
import {
	useContext,
	useEffect,
	useInsertionEffect,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEventHandlers } from '../../writing-flow/use-editable-root-event-handlers';
import { BlockRefs } from '../../provider/block-refs-provider';

/**
 * Registers the block's `wrapperProps` event handlers so the writing flow host
 * can call them when a block that supports `editableRoot` is edited through the
 * host and the events no longer reach the block.
 *
 * Handlers are keyed by client ID in the `BlockRefs` context, so the host
 * resolves them from the block hierarchy. A ref is stored so the host always
 * calls the latest render's handlers, and only blocks that have a handler are
 * registered.
 *
 * @param {string} clientId     Block client ID.
 * @param {Object} wrapperProps The block's merged wrapper props.
 */
export function useRegisterBlockEventHandlers( clientId, wrapperProps ) {
	const { eventHandlers } = useContext( BlockRefs );
	const handlers = getEventHandlers( wrapperProps );
	const handlersRef = useRef();
	useInsertionEffect( () => {
		handlersRef.current = handlers;
	} );

	const hasHandlers = !! handlers;
	useEffect( () => {
		if ( hasHandlers ) {
			eventHandlers.set( clientId, handlersRef );
			return () => eventHandlers.delete( clientId );
		}
	}, [ eventHandlers, clientId, hasHandlers ] );
}
