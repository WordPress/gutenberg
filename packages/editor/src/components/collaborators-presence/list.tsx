import { __ } from '@wordpress/i18n';
import { Popover, Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { type PostEditorAwarenessState } from '@wordpress/core-data';

import { Avatar } from './avatar';

import './styles/collaborators-list.scss';

interface CollaboratorsListProps {
	activeCollaborators: PostEditorAwarenessState[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
}

/**
 * Renders a list showing all active collaborators with their details.
 * Note: activeUsers should already exclude the current user (filtered by parent component).
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
						<span> { activeCollaborators.length } </span>
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
					{ activeCollaborators.map( ( collaboratorState ) => (
						<button
							key={ collaboratorState.clientId }
							className="editor-collaborators-presence__list-item"
							disabled
							style={ {
								opacity: collaboratorState.isConnected
									? 1
									: 0.5,
							} }
						>
							<Avatar
								collaboratorInfo={
									collaboratorState.collaboratorInfo
								}
								showCollaboratorColorBorder
								size="medium"
							/>
							<div className="editor-collaborators-presence__list-item-info">
								<div className="editor-collaborators-presence__list-item-name">
									{ collaboratorState.collaboratorInfo.name }
								</div>
							</div>
						</button>
					) ) }
				</div>
			</div>
		</Popover>
	);
}
