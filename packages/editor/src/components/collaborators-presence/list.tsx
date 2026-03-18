import { __ } from '@wordpress/i18n';
import { Popover, Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { type PostEditorAwarenessState } from '@wordpress/core-data';

import Avatar from './avatar';
import { getAvatarUrl } from '../collaborators-overlay/get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

import './styles/collaborators-list.scss';

interface CollaboratorsListProps {
	activeCollaborators: PostEditorAwarenessState[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
}

/**
 * Renders a list showing all active collaborators with their details.
 * When the showCollaborationCursor preference is enabled, the current user
 * is included and expected to be first in the list.
 * @param props                     Component props
 * @param props.activeCollaborators List of active collaborators
 * @param props.popoverAnchor       Anchor element for the popover
 * @param props.setIsPopoverVisible Callback to set the visibility of the popover
 */
export function CollaboratorsList( {
	activeCollaborators,
	popoverAnchor,
	setIsPopoverVisible,
}: CollaboratorsListProps ) {
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
								disabled
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
