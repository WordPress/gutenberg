import { useCallback, useMemo } from '@wordpress/element';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { useMediaEditor } from './media-editor-state-provider';
import type { EditValue } from './types';

/**
 * What a panel gets for the one edit it owns. Nothing else of the
 * session is exposed: the panel sets its value and marks gestures, and
 * the session handles history, dirty state and reset.
 */
export interface MediaEditorEdit< V extends EditValue > {
	/** The current value, or the default when the edit is not set. */
	value: V;
	/**
	 * Set the value through the session history. A value equal in
	 * content to the default removes the edit instead, so the session
	 * reads as clean and no undo entry is spent storing a default.
	 */
	setValue: ( value: V ) => void;
	/** Open a gesture: changes until `endGesture` make one undo entry. */
	beginGesture: () => void;
	/** Close the gesture and commit it. */
	endGesture: () => void;
}

/**
 * Read and write one named edit in the media editor session.
 *
 * The default lives here, with the panel, not in the session: the
 * session only knows an edit that is set. Define the default once,
 * outside the component, so `setValue` keeps a stable identity.
 *
 * @param name         Edit name, for example `my-plugin/vignette`.
 * @param defaultValue Value to report, and treat as "no edit", when
 *                     the edit is not set.
 * @return The edit's value and the calls to change it.
 */
export function useMediaEditorEdit< V extends EditValue >(
	name: string,
	defaultValue: V
): MediaEditorEdit< V > {
	const { edits, setEdit, beginGesture, endGesture } = useMediaEditor();
	// The slice holds any `EditValue`; the caller's default fixes the type.
	const value = ( edits[ name ] as V | undefined ) ?? defaultValue;

	const setValue = useCallback(
		( next: V ) => {
			setEdit(
				name,
				fastDeepEqual( next, defaultValue ) ? undefined : next
			);
		},
		[ name, defaultValue, setEdit ]
	);

	return useMemo(
		() => ( { value, setValue, beginGesture, endGesture } ),
		[ value, setValue, beginGesture, endGesture ]
	);
}
