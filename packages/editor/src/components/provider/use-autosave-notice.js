import { useLayoutEffect, useState } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';
import { store as editorStore } from '../../store';
import {
	AUTOSAVE_PROPERTIES,
	BROWSER_BACKUP_NOTICE_ID,
} from '../../store/constants';
import {
	getBrowserBackup,
	localAutosaveClear,
} from '../../store/local-autosave';
import { unlock } from '../../lock-unlock';
import useEntityContainsSnapshot from './use-entity-contains-snapshot';

/**
 * Creates the warning notice about a more recent autosave.
 *
 * @param {Object} registry The data registry.
 * @param {Object} autosave The `autosave` editor setting.
 */
function showAutosaveExistsNotice( registry, autosave ) {
	// The only place core exposes the autosave ID is the edit
	// link, always `revision.php?revision=<autosave ID>`.
	const autosaveId = Number( getQueryArg( autosave.editLink, 'revision' ) );
	registry
		.dispatch( noticesStore )
		.createWarningNotice(
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
										const { disableVisualRevisions } =
											registry
												.select( editorStore )
												.getEditorSettings();
										if ( disableVisualRevisions ) {
											window.location.href =
												autosave.editLink;
											return;
										}
										unlock(
											registry.dispatch( editorStore )
										).setCurrentRevisionId( autosaveId );
									},
								}
							: { url: autosave.editLink } ),
					},
				],
			}
		);
}

/**
 * Creates the warning notice offering to restore the browser backup.
 *
 * @param {Object}   registry  The data registry.
 * @param {Object}   backup    The browser backup.
 * @param {Function} onDismiss Called when the notice is dismissed.
 */
function showBrowserBackupNotice( registry, backup, onDismiss ) {
	registry.dispatch( noticesStore ).createWarningNotice(
		// Backups written before the time was recorded don't have one.
		backup.time
			? sprintf(
					/* translators: %s: Date and time the backup was made. */
					__(
						'The backup of this post in your browser from %s is different from the version below.'
					),
					dateI18n( getDateSettings().formats.datetime, backup.time )
				)
			: __(
					'The backup of this post in your browser is different from the version below.'
				),
		{
			id: BROWSER_BACKUP_NOTICE_ID,
			onDismiss,
			actions: [
				{
					label: __( 'View the backup' ),
					onClick: () =>
						unlock(
							registry.dispatch( editorStore )
						).viewBrowserBackup( backup ),
				},
			],
		}
	);
}

/**
 * Shows at most one notice offering a newer version of the post: the
 * browser backup, or else the server autosave.
 *
 * The browser backup is cleared after every successful server autosave, so
 * a backup that differs from the post holds edits newer than any autosave
 * made in this tab, and takes the place of the autosave notice.
 *
 * Under real-time collaboration, the backup and the autosave each record a
 * Yjs snapshot of the shared document they captured. The notice decision is
 * deferred until the shared document is checked against those snapshots
 * (see `useEntityContainsSnapshot`): a positive result proves the document
 * holds everything the backup or autosave did, so its notice is redundant.
 *
 * IMPORTANT: Call this hook only once the post is the edited one, so that the
 * checks read this post. Its notice is removed when the hook unmounts.
 *
 * @param {Object}  props          Hook props.
 * @param {string}  props.postType The post type.
 * @param {number}  props.postId   The post ID.
 * @param {boolean} props.isNew    Whether the post is new.
 * @param {boolean} props.recovery Whether the editor is in recovery mode.
 * @param {Object}  props.autosave The `autosave` editor setting.
 */
export default function useAutosaveNotice( {
	postType,
	postId,
	isNew,
	recovery,
	autosave,
} ) {
	const registry = useRegistry();
	const [ backup ] = useState( () => getBrowserBackup( postId, isNew ) );
	// Assume the autosave is not needed in the case of an error recovery.
	const newerAutosave = recovery ? undefined : autosave;

	const backupStatus = useEntityContainsSnapshot( {
		postType,
		postId,
		snapshot: backup?.snapshot,
	} );
	const autosaveStatus = useEntityContainsSnapshot( {
		postType,
		postId,
		snapshot: newerAutosave?.crdtSnapshot,
	} );

	useLayoutEffect( () => {
		if ( 'pending' === backupStatus || 'pending' === autosaveStatus ) {
			return;
		}

		if ( backup ) {
			const { getEditedPostAttribute } = registry.select( editorStore );
			const hasDifference = AUTOSAVE_PROPERTIES.some(
				( key ) => backup[ key ] !== getEditedPostAttribute( key )
			);
			const clearBackup = () =>
				localAutosaveClear( postId, isNew, backup.time );

			// Show the backup unless the post or the shared document already
			// holds it, e.g. after a revision restore under collaboration.
			if ( hasDifference && 'present' !== backupStatus ) {
				showBrowserBackupNotice( registry, backup, clearBackup );
				return () =>
					registry
						.dispatch( noticesStore )
						.removeNotice( BROWSER_BACKUP_NOTICE_ID );
			}
			clearBackup();
		}

		if ( newerAutosave && 'present' !== autosaveStatus ) {
			showAutosaveExistsNotice( registry, newerAutosave );
			return () =>
				registry
					.dispatch( noticesStore )
					.removeNotice( 'autosave-exists' );
		}

		// Each snapshot status settles at most once, so a notice is created
		// at most once. The caller keys this hook by post, so the backup and
		// the autosave are stable for its lifetime.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ backupStatus, autosaveStatus ] );
}
