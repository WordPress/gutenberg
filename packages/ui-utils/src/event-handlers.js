/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * Merges event handlers together.
 *
 * @template TEvent
 * @param {(event: TEvent) => void} handler
 * @param {(event: TEvent) => void} otherHandler
 */
export function mergeEvent( handler, otherHandler ) {
	return (
		/* eslint-disable jsdoc/no-undefined-types */
		/** @type {TEvent} */
		/* eslint-enable jsdoc/no-undefined-types */
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
 * Merges a set of event handlers together.
 *
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
