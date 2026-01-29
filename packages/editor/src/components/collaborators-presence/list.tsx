// import { speak } from '@wordpress/a11y';
import { Popover, Button } from '@wordpress/components';
import { close } from '@wordpress/icons';

import { Avatar } from './avatar';

import './styles/collaborators-list.scss';

interface CollaboratorsListProps {
	activeUsers: {
		clientId: string;
		isConnected: boolean;
		userInfo: {
			name: string;
			color: string;
			avatar_urls?: Record< string, string >;
		};
	}[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
}

/**
 * Renders a list showing all active collaborators with their details.
 * Note: activeUsers should already exclude the current user (filtered by parent component).
 * @param root0
 * @param root0.activeUsers
 * @param root0.popoverAnchor
 * @param root0.setIsPopoverVisible
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
						Collaborators
						<span> { activeUsers.length } </span>
					</div>
					<div className="editor-collaborators-presence__list-header-action">
						<Button
							__next40pxDefaultSize
							icon={ close }
							iconSize={ 16 }
							label="Close Collaborators List"
							onClick={ () => setIsPopoverVisible( false ) }
						/>
					</div>
				</div>
				<div className="editor-collaborators-presence__list-items">
					{ activeUsers.map( ( userState ) => (
						<button
							key={ userState.clientId }
							className="editor-collaborators-presence__list-item"
							onClick={ () => {} }
							disabled={ ! userState.isConnected }
							aria-label="Clicking scrolls to cursor position in the editor"
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
