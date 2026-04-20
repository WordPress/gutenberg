/**
 * Internal dependencies
 */
import type { Media } from '../components/media-editor-provider';

type OnUpdateCallback = ( updated: Partial< Media > & { id: number } ) => void;

const callbacks = new Map< number, OnUpdateCallback >();
let nextInvocationId = 1;

export function registerCallback( callback: OnUpdateCallback ): number {
	const id = nextInvocationId++;
	callbacks.set( id, callback );
	return id;
}

export function getCallback(
	id: number | null | undefined
): OnUpdateCallback | null {
	if ( id === null || id === undefined ) {
		return null;
	}
	return callbacks.get( id ) ?? null;
}

export function unregisterCallback( id: number | null | undefined ): void {
	if ( id === null || id === undefined ) {
		return;
	}
	callbacks.delete( id );
}
