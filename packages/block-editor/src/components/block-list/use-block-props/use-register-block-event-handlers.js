/**
 * WordPress dependencies
 */
import { useEffect, useInsertionEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getEventHandlers,
	setBlockEventHandlers,
} from '../../writing-flow/editable-root-event-handlers';

/**
 * Registers the block's `wrapperProps` event handlers so the writing flow host
 * can call them when a block that supports `editableRoot` is edited through the
 * host and the events no longer reach the block.
 *
 * Handlers are keyed by client ID, so the host resolves them from the block
 * hierarchy. A ref is stored so the host always calls the latest render's
 * handlers, and only blocks that have a handler are registered.
 *
 * @param {string} clientId     Block client ID.
 * @param {Object} wrapperProps The block's merged wrapper props.
 */
export function useRegisterBlockEventHandlers( clientId, wrapperProps ) {
	const handlers = getEventHandlers( wrapperProps );
	const handlersRef = useRef();
	useInsertionEffect( () => {
		handlersRef.current = handlers;
	} );

	const hasHandlers = !! handlers;
	useEffect( () => {
		if ( hasHandlers ) {
			return setBlockEventHandlers( clientId, handlersRef );
		}
	}, [ clientId, hasHandlers ] );
}
