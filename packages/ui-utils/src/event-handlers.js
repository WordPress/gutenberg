/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * @template TEvent
 * @param {(event: TEvent) => void} handler
 * @param {(event: TEvent) => void} otherHandler
 */
export function mergeEvent( handler, otherHandler ) {
	return (
		/** @type {TEvent} */
		event
	) => {
		if ( is.function( handler ) ) {
			handler( event );
		}
		if ( is.function( otherHandler ) ) {
			otherHandler( event );
		}
	};
}

/**
 * @template TEvent
 * @param {Record<string, (event: TEvent) => void>} handlers
 * @param {Record<string, (event: TEvent) => void>} extraHandlers
 */
export function mergeEventHandlers( handlers = {}, extraHandlers = {} ) {
	const mergedHandlers = { ...handlers };

	for ( const [ key, handler ] of Object.entries( mergedHandlers ) ) {
		if ( is.function( extraHandlers[ key ] ) ) {
			mergedHandlers[ key ] = mergeEvent( handler, extraHandlers[ key ] );
		}
	}

	return mergedHandlers;
}

/**
 * @template TEvent
 * @param {(event: TEvent) => void} handler
 * @param {(event: TEvent) => void} htmlHandler
 */
export function useMergeEventCallback( handler, htmlHandler ) {
	return useCallback( mergeEvent( handler, htmlHandler ), [
		handler,
		htmlHandler,
	] );
}
