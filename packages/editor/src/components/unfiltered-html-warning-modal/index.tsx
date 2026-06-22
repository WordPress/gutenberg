/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis } from '@wordpress/block-editor';
import { Button, Modal } from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	confirmRoomSync,
	getCurrentPostRoom,
	isCurrentPostUnfilteredHtmlGated,
	isRoomSyncConfirmed,
} from './pause-room-sync';

const { BlockCanvasCover } = unlock( privateApis );

/**
 * Warns a collaborator who lacks the unfiltered_html capability, before they
 * make any change, that the post contains CSS or JavaScript that will be
 * removed once they edit or save the document. Rendered via BlockCanvasCover.Fill
 * so it blocks the canvas until the user confirms or leaves.
 *
 * The warning is shown once per editor load; confirming dismisses it for the
 * current session.
 *
 * @return The modal component, or null when no warning is needed.
 */
export function UnfilteredHTMLWarningModal() {
	const [ confirmed, setConfirmed ] = useState( false );

	const { shouldWarn, postType, room } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const { getPostType: getPostTypeRecord } = unlock(
			select( coreDataStore )
		);

		const currentPostType = getCurrentPostType();

		return {
			// Same gate the pause filter uses, so the document is paused exactly
			// while this warning is shown.
			shouldWarn: isCurrentPostUnfilteredHtmlGated( select ),
			postType: currentPostType
				? getPostTypeRecord( currentPostType )
				: null,
			room: getCurrentPostRoom( select ),
		};
	}, [] );

	// The post's sync is paused (by the pause filter) for as long as this
	// warning applies and has not been confirmed; confirming releases it.
	if (
		! shouldWarn ||
		confirmed ||
		( room && isRoomSyncConfirmed( room ) )
	) {
		return null;
	}

	const onContinue = () => {
		if ( room ) {
			confirmRoomSync( room );
		}
		setConfirmed( true );
	};

	let editPostHref = 'edit.php';
	if ( postType?.slug ) {
		editPostHref = `edit.php?post_type=${ postType.slug }`;
	}

	return (
		<BlockCanvasCover.Fill>
			<Modal
				overlayClassName="editor-unfiltered-html-warning-modal"
				isDismissible={ false }
				onRequestClose={ () => {} }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				size="medium"
				title={ __( 'Custom HTML will be removed' ) }
			>
				<Stack direction="column" gap="xl">
					<p>
						{ __(
							'This post contains CSS or JavaScript that will be removed when you edit the document or save, because you do not have permission to use unfiltered HTML. Are you sure you want to edit this document?'
						) }
					</p>
					<Stack direction="row" gap="sm" justify="flex-end">
						<Button
							__next40pxDefaultSize
							href={ editPostHref }
							variant="tertiary"
						>
							{ sprintf(
								/* translators: %s: Post type name (e.g., "Posts", "Pages"). */
								__( 'Back to %s' ),
								postType?.labels?.name ?? __( 'Posts' )
							) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ onContinue }
						>
							{ __( 'Continue editing' ) }
						</Button>
					</Stack>
				</Stack>
			</Modal>
		</BlockCanvasCover.Fill>
	);
}
