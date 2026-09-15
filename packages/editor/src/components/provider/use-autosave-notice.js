import { useLayoutEffect } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useEntityContainsSnapshot from './use-entity-contains-snapshot';

/**
 * Creates the warning notice about a more recent autosave.
 *
 * @param {Object}   props                      Function props.
 * @param {Object}   props.autosave             The `autosave` editor setting.
 * @param {Function} props.createWarningNotice  Action that creates the notice.
 * @param {Object}   props.registry             The data registry.
 * @param {Function} props.setCurrentRevisionId Action that opens a revision.
 */
function showAutosaveExistsNotice( {
	autosave,
	createWarningNotice,
	registry,
	setCurrentRevisionId,
} ) {
	// The only place core exposes the autosave ID is the edit
	// link, always `revision.php?revision=<autosave ID>`.
	const autosaveId = Number( getQueryArg( autosave.editLink, 'revision' ) );
	createWarningNotice(
		__(
			'There is an autosave of this post that is more recent than the version below.'
		),
		{
			id: 'autosave-exists',
			actions: [
				{
					label: __( 'View the autosave' ),
					...( autosaveId
						? {
								onClick: () => {
									// `disableVisualRevisions` is only set
									// after mount, so read it at click time.
									const { disableVisualRevisions } = registry
										.select( editorStore )
										.getEditorSettings();
									if ( disableVisualRevisions ) {
										window.location.href =
											autosave.editLink;
										return;
									}
									setCurrentRevisionId( autosaveId );
								},
						  }
						: { url: autosave.editLink } ),
				},
			],
		}
	);
}

/**
 * Shows the "more recent autosave" notice when applicable.
 *
 * Outside real-time collaboration, the notice is created immediately on
 * mount whenever the server flagged an autosave (`settings.autosave`).
 *
 * Under real-time collaboration, the autosave content is usually already
 * part of the shared document, making the notice redundant. The autosave
 * records a Yjs snapshot of the document it captured, which the server
 * returns in `settings.autosave.crdtSnapshot`. The notice decision is
 * deferred until the shared document is checked against that snapshot (see
 * `useEntityContainsSnapshot`): a positive result proves this document
 * holds everything the autosave did, so the notice is not necessary.
 *
 * IMPORTANT: Call this hook after the mount effect that dispatches
 * `setupEditor`, so that the collaboration check can read the current post.
 *
 * @param {Object}  props          Hook props.
 * @param {Object}  props.post     The post object.
 * @param {boolean} props.recovery Whether the editor is in recovery mode.
 * @param {Object}  props.settings The editor settings.
 */
export default function useAutosaveNotice( { post, recovery, settings } ) {
	const registry = useRegistry();
	const { createWarningNotice } = useDispatch( noticesStore );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	// Assume the notice is not needed in the case of an error recovery.
	// Passing no snapshot resolves the snapshot status immediately.
	const snapshotStatus = useEntityContainsSnapshot( {
		postType: post.type,
		postId: post.id,
		snapshot: recovery ? undefined : settings.autosave?.crdtSnapshot,
	} );

	useLayoutEffect( () => {
		if ( recovery || ! settings.autosave ) {
			return;
		}

		// The shared document already accounts for the autosaved content,
		// so the notice is redundant.
		if ( 'present' === snapshotStatus ) {
			return;
		}

		// Keep waiting for the snapshot status to resolve.
		if ( 'pending' === snapshotStatus ) {
			return;
		}

		showAutosaveExistsNotice( {
			autosave: settings.autosave,
			createWarningNotice,
			registry,
			setCurrentRevisionId,
		} );

		// The snapshot status settles at most once, so the notice is
		// created at most once. `settings.autosave` and the notice actions
		// are stable for the lifetime of the provider.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ snapshotStatus ] );
}
