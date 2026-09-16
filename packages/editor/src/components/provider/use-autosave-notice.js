import { useLayoutEffect } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
 * Shows the "more recent autosave" notice when applicable: created once on
 * mount whenever the server flagged an autosave (`settings.autosave`).
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

	useLayoutEffect( () => {
		// Assume the notice is not needed in the case of an error recovery.
		if ( recovery || ! settings.autosave ) {
			return;
		}

		showAutosaveExistsNotice( {
			autosave: settings.autosave,
			createWarningNotice,
			registry,
			setCurrentRevisionId,
		} );
		// `settings.autosave` and the notice actions are stable for the
		// lifetime of the provider, so the notice is created at most once.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ post.id ] );
}
