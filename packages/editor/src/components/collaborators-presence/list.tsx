import { __ } from '@wordpress/i18n';
import { Popover, Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import {
	privateApis as coreDataPrivateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import Avatar from './avatar';
import { getAvatarUrl } from '../collaborators-overlay/get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { type CursorRegistry } from '../collaborators-overlay/cursor-registry';
import { resolvePrimaryPosition } from '../collaborators-overlay/resolve-primary-position';
import { unlock } from '../../lock-unlock';

const { useResolvedSelection } = unlock( coreDataPrivateApis );

interface CollaboratorsListProps {
	activeCollaborators: PostEditorAwarenessState[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
	cursorRegistry: CursorRegistry;
	postId: number | null;
	postType: string | null;
}

/**
 * Renders a list showing all active collaborators with their details.
 * When the showCollaborationCursor preference is enabled, the current user
 * is included and expected to be first in the list.
 * @param props                     Component props
 * @param props.activeCollaborators List of active collaborators
 * @param props.popoverAnchor       Anchor element for the popover
 * @param props.setIsPopoverVisible Callback to set the visibility of the popover
 * @param props.cursorRegistry      Shared registry for scroll-to-cursor support
 * @param props.postId              ID of the post
 * @param props.postType            Type of the post
 */
export function CollaboratorsList( {
	activeCollaborators,
	popoverAnchor,
	setIsPopoverVisible,
	cursorRegistry,
	postId,
	postType,
}: CollaboratorsListProps ) {
	const resolveSelection = useResolvedSelection( postId, postType );
	const { selectBlock } = useDispatch( blockEditorStore );

	const handleCollaboratorClick = (
		collaboratorState: PostEditorAwarenessState
	) => {
		// Select the collaborator's actual block first, even if it's nested
		// inside collapsed content (e.g. a closed core/details or an
		// inactive core/accordion panel). Both of those blocks — and any
		// future block following the same convention — already auto-expand
		// whenever one of their inner blocks is selected, so this reveals
		// hidden content as a side effect without any block-specific
		// "expand" logic here.
		const resolved = resolvePrimaryPosition(
			collaboratorState.editorState?.selection,
			resolveSelection
		);
		if ( resolved?.localClientId ) {
			selectBlock( resolved.localClientId );
		}

		// Defer the scroll by a frame so the selection above has a chance
		// to expand any collapsed container and update layout first —
		// otherwise we'd scroll to the pre-expansion position.
		requestAnimationFrame( () => {
			const success = cursorRegistry.scrollToCursor(
				collaboratorState.clientId,
				{
					behavior: 'smooth',
					block: 'center',
					highlightDuration: 2000,
				}
			);

			if ( success ) {
				speak( __( 'Scrolled to cursor' ), 'polite' );
			}
		} );

		setIsPopoverVisible( false );
	};

	return (
		<Popover
			anchor={ popoverAnchor }
			placement="bottom"
			offset={ 8 }
			className="editor-collaborators-presence__list"
			onClose={ () => setIsPopoverVisible( false ) }
		>
			<div className="editor-collaborators-presence__list-content">
				<div className="editor-collaborators-presence__list-header">
					<div className="editor-collaborators-presence__list-header-title">
						{ __( 'Collaborators' ) }
						<span>{ activeCollaborators.length }</span>
					</div>
					<div className="editor-collaborators-presence__list-header-action">
						<Button
							__next40pxDefaultSize
							icon={ closeSmall }
							iconSize={ 24 }
							label={ __( 'Close Collaborators List' ) }
							onClick={ () => setIsPopoverVisible( false ) }
						/>
					</div>
				</div>
				<div className="editor-collaborators-presence__list-items">
					{ activeCollaborators.map( ( collaboratorState ) => {
						const isCurrentUser = collaboratorState.isMe;
						return (
							<button
								key={ collaboratorState.clientId }
								className="editor-collaborators-presence__list-item"
								disabled={ isCurrentUser }
								onClick={ () =>
									handleCollaboratorClick( collaboratorState )
								}
							>
								<Avatar
									src={ getAvatarUrl(
										collaboratorState.collaboratorInfo
											.avatar_urls
									) }
									name={
										collaboratorState.collaboratorInfo.name
									}
									borderColor={
										isCurrentUser
											? 'var(--wp-admin-theme-color)'
											: getAvatarBorderColor(
													collaboratorState
														.collaboratorInfo.id
											  )
									}
									dimmed={ ! collaboratorState.isConnected }
								/>
								<div className="editor-collaborators-presence__list-item-info">
									<div className="editor-collaborators-presence__list-item-name">
										{ isCurrentUser
											? __( 'You' )
											: collaboratorState.collaboratorInfo
													.name }
									</div>
								</div>
							</button>
						);
					} ) }
				</div>
			</div>
		</Popover>
	);
}
