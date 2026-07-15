/**
 * WordPress dependencies
 */
import { useInsertionEffect, useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	getEventHandlers,
	setBlockEventHandlers,
	noteEventTypes,
} from '../../writing-flow/editable-root-event-handlers';

/**
 * Registers the block's `wrapperProps` event handlers so the writing flow host
 * can call them when a block that supports `editableRoot` is edited through the
 * host and the events no longer reach the block.
 *
 * The handlers are stored keyed by the block element, so the entry is collected
 * with the element on unmount without an explicit deregistration. A ref is
 * stored so the host always calls the latest render's handlers.
 *
 * @param {Object} wrapperProps The block's merged wrapper props.
 *
 * @return {Function} Ref to attach to the block element.
 */
export function useRegisterBlockEventHandlers( wrapperProps ) {
	const handlers = getEventHandlers( wrapperProps );
	const handlersRef = useRef();
	useInsertionEffect( () => {
		handlersRef.current = handlers;
		if ( handlers ) {
			noteEventTypes( handlers );
		}
	} );

	return useRefEffect( ( element ) => {
		setBlockEventHandlers( element, handlersRef );
	}, [] );
}
