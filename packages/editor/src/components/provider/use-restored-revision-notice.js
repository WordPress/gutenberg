import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { store as noticesStore } from '@wordpress/notices';
import { takeRestoredRevisionNotice } from '../../utils/restored-revision-notice';

/**
 * Shows the notice for a revision that was restored before this page loaded.
 *
 * @param {Object} post The post being edited.
 */
export default function useRestoredRevisionNotice( post ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const postType = post.type;
	const postId = post.id;

	useEffect( () => {
		const restored = takeRestoredRevisionNotice( { postType, postId } );

		if ( ! restored ) {
			return;
		}

		createSuccessNotice(
			restored.date
				? sprintf(
						/* translators: %s: Date and time of the revision. */
						__( 'Restored to revision from %s.' ),
						dateI18n(
							getDateSettings().formats.datetime,
							restored.date
						)
				  )
				: __( 'Restored to the selected revision.' ),
			{
				type: 'snackbar',
				id: 'editor-revision-restored',
			}
		);
	}, [ postType, postId, createSuccessNotice ] );
}
