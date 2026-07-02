/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostTypeSupportCheck from '../post-type-support-check';
import useInterval from './use-interval';

function AutosaveMonitorInner( { interval, autosave } ) {
	const { autosave: autosaveAction } = useDispatch( editorStore );
	const { createWarningNotice } = useDispatch( noticesStore );
	const triggerAutosave = autosave ?? autosaveAction;

	const { getReferenceByDistinctEdits } = useSelect( coreStore );
	const {
		isEditedPostDirty,
		isEditedPostAutosaveable,
		isAutosavingPost,
		getEditorSettings,
	} = useSelect( editorStore );

	const autosaveInterval = useSelect(
		( select ) => {
			if ( interval !== undefined ) {
				return interval;
			}

			return select( editorStore ).getEditorSettings().autosaveInterval;
		},
		[ interval ]
	);

	// Warn the user once when the server already holds an autosave that is more
	// recent than the loaded post.
	useEffect( () => {
		const { autosave: existingAutosave } = getEditorSettings();
		if ( ! existingAutosave ) {
			return;
		}

		createWarningNotice(
			__(
				'There is an autosave of this post that is more recent than the version below.'
			),
			{
				id: 'autosave-exists',
				actions: [
					{
						label: __( 'View the autosave' ),
						url: existingAutosave.editLink,
					},
				],
			}
		);
	}, [ getEditorSettings, createWarningNotice ] );

	// Reference of the edits last considered for autosaving. Mutable state that
	// must not trigger a re-render, hence a ref.
	const lastEditsReferenceRef = useRef();

	useInterval( () => {
		// The post can't be autosaved yet (e.g. its existing autosave is still
		// loading). Keep any pending edits and try again on the next tick.
		if ( ! isEditedPostAutosaveable() ) {
			return;
		}

		const editsReference = getReferenceByDistinctEdits();
		const hasNewEdits = editsReference !== lastEditsReferenceRef.current;
		if ( hasNewEdits && isEditedPostDirty() && ! isAutosavingPost() ) {
			// Only consume the edits reference when we autosave,
			// so edits made during an in-flight autosave aren't skipped.
			lastEditsReferenceRef.current = editsReference;
			triggerAutosave();
		}
	}, autosaveInterval );

	return null;
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 *
 * The post is checked every `interval` seconds and autosaved when there is something new to save.
 * Renders nothing when the post type doesn't support autosaves.
 *
 * @param {Object}   props            The component props.
 * @param {number}   [props.interval] Time in seconds between checks. Defaults to the editor's
 *                                    `autosaveInterval` setting.
 * @param {Function} [props.autosave] Function to call when changes need to be saved. Defaults to the
 *                                    editor store's `autosave` action.
 *
 * @example
 * ```jsx
 * <AutosaveMonitor interval={ 30 } />
 * ```
 */
export default function AutosaveMonitor( props ) {
	return (
		<PostTypeSupportCheck supportKeys="autosave">
			<AutosaveMonitorInner { ...props } />
		</PostTypeSupportCheck>
	);
}
