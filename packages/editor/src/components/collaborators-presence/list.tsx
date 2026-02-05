import { __ } from '@wordpress/i18n';
import { Popover, Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { type PostEditorAwarenessState } from '@wordpress/core-data';

import { Avatar } from './avatar';

import './styles/collaborators-list.scss';

interface CollaboratorsListProps {
	activeUsers: PostEditorAwarenessState[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
}

/**
 * Renders a list showing all active collaborators with their details.
 * Note: activeUsers should already exclude the current user (filtered by parent component).
 * @param props                     Component props
 * @param props.activeUsers         List of active users
 * @param props.popoverAnchor       Anchor element for the popover
 * @param props.setIsPopoverVisible Callback to set the visibility of the popover
 */
export function CollaboratorsList( {
	activeUsers,
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
						<span> { activeUsers.length } </span>
					</div>
					<div className="editor-collaborators-presence__list-header-action">
						<Button
							__next40pxDefaultSize
							icon={ close }
							iconSize={ 16 }
							label={ __( 'Close Collaborators List' ) }
							onClick={ () => setIsPopoverVisible( false ) }
						/>
					</div>
				</div>
				<div className="editor-collaborators-presence__list-items">
					{ activeUsers.map( ( userState ) => (
						<button
							key={ userState.clientId }
							className="editor-collaborators-presence__list-item"
							disabled
							style={ {
								opacity: userState.isConnected ? 1 : 0.5,
							} }
						>
							<Avatar
								userInfo={ userState.userInfo }
								showUserColorBorder
								size="medium"
							/>
							<div className="editor-collaborators-presence__list-item-info">
								<div className="editor-collaborators-presence__list-item-name">
									{ userState.userInfo.name }
								</div>
							</div>
						</button>
					) ) }
				</div>
			</div>
		</Popover>
	);
}
