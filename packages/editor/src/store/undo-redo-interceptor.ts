/**
 * Lets a component take part in the editor's undo and redo.
 *
 * The editor's `undo` and `redo` actions ask the interceptor before they
 * reach core-data. It is held per editor store, so each editor has its own
 * and the core-data actions, which editors in sub-registries share, stay as
 * they are.
 */
import { STORE_NAME } from './constants';

/** What runs ahead of the editor's undo and redo. */
export interface UndoRedoInterceptor {
	/** Runs before an undo. Returning true consumes it. */
	undo?: () => boolean;
	/** Runs before a redo. Returning true consumes it. */
	redo?: () => boolean;
}

const interceptors = new WeakMap< object, UndoRedoInterceptor >();

/**
 * The key an editor's interceptor is held under: its store's actions object.
 * Not the registry, which a thunk and `useRegistry` see as different objects.
 *
 * @param registry The editor's data registry.
 * @return The key.
 */
function getEditorKey( registry: any ): object {
	return registry.dispatch( STORE_NAME );
}

/**
 * Set the interceptor of an editor's undo and redo, replacing any other.
 *
 * @param registry    The editor's data registry.
 * @param interceptor The interceptor.
 * @return Removes the interceptor, unless another has replaced it since.
 */
export function setUndoRedoInterceptor(
	registry: any,
	interceptor: UndoRedoInterceptor
): () => void {
	const key = getEditorKey( registry );
	interceptors.set( key, interceptor );
	return () => {
		if ( interceptors.get( key ) === interceptor ) {
			interceptors.delete( key );
		}
	};
}

/**
 * Run an editor's interceptor ahead of an undo or a redo.
 *
 * @param registry The editor's data registry.
 * @param action   Which of the two is about to run.
 * @return Whether the interceptor consumed it.
 */
export function interceptUndoRedo(
	registry: any,
	action: 'undo' | 'redo'
): boolean {
	return (
		interceptors.get( getEditorKey( registry ) )?.[ action ]?.() === true
	);
}
