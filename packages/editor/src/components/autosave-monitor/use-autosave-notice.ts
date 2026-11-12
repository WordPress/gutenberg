import { useLayoutEffect, useState } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';
import { store as editorStore } from '../../store';
import {
	AUTOSAVE_NOTICE_ID,
	AUTOSAVE_PROPERTIES,
	BROWSER_BACKUP_NOTICE_ID,
} from '../../store/constants';
import {
	getBrowserBackup,
	localAutosaveClear,
} from '../../store/local-autosave';
import { unlock } from '../../lock-unlock';
import useEntityContainsSnapshot, {
	type SnapshotStatus,
} from './use-entity-contains-snapshot';

type Registry = ReturnType< typeof useRegistry >;

interface BrowserBackup {
	title: string;
	content: string;
	excerpt: string;
	time?: number;
	snapshot?: string;
}

interface Autosave {
	editLink: string;
	crdtSnapshot?: string;
}

/**
 * Decides which notice offers a newer version of a post on load: the
 * browser backup, else the server autosave, else none.
 *
 * @param props                     Function props.
 * @param props.backupStatus        Whether the shared document holds the backup.
 * @param props.autosaveStatus      Whether the shared document holds the autosave.
 * @param props.hasBackupDifference Whether there is a backup that differs from the post.
 * @param props.hasAutosave         Whether the server flagged a newer autosave.
 * @return The notice to show, or 'pending' while a snapshot check runs.
 */
export function getAutosaveNotice( {
	backupStatus,
	autosaveStatus,
	hasBackupDifference,
	hasAutosave,
}: {
	backupStatus: SnapshotStatus;
	autosaveStatus: SnapshotStatus;
	hasBackupDifference: boolean;
	hasAutosave: boolean;
} ): 'pending' | 'backup' | 'autosave' | null {
	if ( 'pending' === backupStatus || 'pending' === autosaveStatus ) {
		return 'pending';
	}
	if ( hasBackupDifference && 'present' !== backupStatus ) {
		return 'backup';
	}
	if ( hasAutosave && 'present' !== autosaveStatus ) {
		return 'autosave';
	}
	return null;
}

function showAutosaveNotice( registry: Registry, autosave: Autosave ) {
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
				id: AUTOSAVE_NOTICE_ID,
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
												.getEditorSettings() as {
												disableVisualRevisions?: boolean;
											};
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

function showBrowserBackupNotice(
	registry: Registry,
	backup: BrowserBackup,
	onDismiss: () => void
) {
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
 * a backup that differs from the post holds edits the same as or newer than
 * any autosave made in this tab, and takes the place of the autosave notice.
 *
 * Under real-time collaboration, the backup and the autosave each record a
 * Yjs snapshot of the shared document they captured. The decision waits
 * until the shared document is checked against those snapshots (see
 * `useEntityContainsSnapshot`): a positive result proves the document holds
 * everything the backup or autosave did, so its notice is redundant.
 *
 * IMPORTANT: Mount this hook only once the post is the edited one, and key it
 * by post. Its notice is removed when it unmounts.
 *
 * @param props            Hook props.
 * @param props.postType   The post type.
 * @param props.postId     The post ID.
 * @param props.isNew      Whether the post is new.
 * @param [props.autosave] The `autosave` editor setting.
 */
export default function useAutosaveNotice( {
	postType,
	postId,
	isNew,
	autosave,
}: {
	postType: string;
	postId: number | string;
	isNew: boolean;
	autosave?: Autosave;
} ) {
	const registry = useRegistry();
	const [ backup ] = useState(
		() => getBrowserBackup( postId, isNew ) as BrowserBackup | null
	);

	const backupStatus = useEntityContainsSnapshot( {
		postType,
		postId,
		snapshot: backup?.snapshot,
	} );
	const autosaveStatus = useEntityContainsSnapshot( {
		postType,
		postId,
		snapshot: autosave?.crdtSnapshot,
	} );

	useLayoutEffect( () => {
		const { getEditedPostAttribute } = registry.select( editorStore );
		const notice = getAutosaveNotice( {
			backupStatus,
			autosaveStatus,
			hasBackupDifference:
				!! backup &&
				AUTOSAVE_PROPERTIES.some(
					( key ) =>
						backup[ key as keyof BrowserBackup ] !==
						getEditedPostAttribute( key )
				),
			hasAutosave: !! autosave,
		} );
		if ( 'pending' === notice ) {
			return undefined;
		}

		// A backup the post or the shared document already holds is redundant.
		if ( backup && 'backup' !== notice ) {
			localAutosaveClear( postId, isNew, backup.time );
		}

		const { removeNotice } = registry.dispatch( noticesStore );
		if ( 'backup' === notice && backup ) {
			showBrowserBackupNotice( registry, backup, () =>
				localAutosaveClear( postId, isNew, backup.time )
			);
			return () => {
				removeNotice( BROWSER_BACKUP_NOTICE_ID );
			};
		}
		if ( 'autosave' === notice && autosave ) {
			showAutosaveNotice( registry, autosave );
			return () => {
				removeNotice( AUTOSAVE_NOTICE_ID );
			};
		}
		return undefined;

		// Each snapshot status settles at most once, so a notice is created
		// at most once. The values read on mount are used on purpose: the
		// backup was read under the key the post had then.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ backupStatus, autosaveStatus ] );
}
