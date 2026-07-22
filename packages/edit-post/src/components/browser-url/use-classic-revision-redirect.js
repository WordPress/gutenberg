/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Redirects the selected revision to the classic revisions screen when visual
 * revisions are disabled.
 */
export default function useClassicRevisionRedirect() {
	const registry = useRegistry();
	const { disableVisualRevisions, currentRevisionId, postType, postId } =
		useSelect( ( select ) => {
			const editor = select( editorStore );
			return {
				disableVisualRevisions:
					!! editor.getEditorSettings().disableVisualRevisions,
				currentRevisionId: unlock( editor ).getCurrentRevisionId(),
				postType: editor.getCurrentPostType(),
				postId: editor.getCurrentPostId(),
			};
		}, [] );
	const hasClassicRevisionScreen = ! [
		'wp_template',
		'wp_template_part',
	].includes( postType );

	useEffect( () => {
		if (
			! disableVisualRevisions ||
			! hasClassicRevisionScreen ||
			! currentRevisionId ||
			! postType ||
			! postId
		) {
			return;
		}

		let cancelled = false;
		// Invalid IDs trigger `wp_die()` before JavaScript loads. Check that the
		// revision belongs to this post before redirecting.
		registry
			.resolveSelect( coreStore )
			.getRevision( 'postType', postType, postId, currentRevisionId, {
				context: 'edit',
				_fields: 'id',
			} )
			.then( ( revision ) => {
				if ( cancelled || ! revision ) {
					return;
				}

				const editor = registry.select( editorStore );
				const isStillSelected =
					!! editor.getEditorSettings().disableVisualRevisions &&
					editor.getCurrentPostType() === postType &&
					String( editor.getCurrentPostId() ) === String( postId ) &&
					unlock( editor ).getCurrentRevisionId() ===
						currentRevisionId;
				if ( ! isStillSelected ) {
					return;
				}

				window.location.href = addQueryArgs( 'revision.php', {
					revision: currentRevisionId,
				} );
			} );

		return () => {
			cancelled = true;
		};
	}, [
		disableVisualRevisions,
		hasClassicRevisionScreen,
		currentRevisionId,
		postType,
		postId,
		registry,
	] );
}
