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
	// const handleCollaboratorClick = ( clientId: number ) => {
	// const userName = activeUsers.find(
	// 	( user ) => user.clientId === clientId
	// )?.userInfo.name;

	// const success = cursorRegistry.scrollToCursor( clientId, {
	// 	behavior: 'smooth',
	// 	block: 'center',
	// 	highlightDuration: 2000,
	// } );

	// Announce the action to screen readers
	// if ( success && userName ) {
	// 	speak( `Scrolled to ${ userName }'s cursor`, 'polite' );
	// }

	// // Close the popover after successful scroll
	// if ( success ) {
	// 	setIsPopoverVisible( false );
	// }
	// };

	return (
		<Popover
			anchor={ popoverAnchor }
			placement="bottom"
			offset={ 8 }
			className="vip-real-time-collaboration-collaborators-list"
		>
			<div className="vip-real-time-collaboration-collaborators-list-content">
				<div className="vip-real-time-collaboration-collaborators-list-header">
					<div className="vip-real-time-collaboration-collaborators-list-header-title">
						Collaborators
						<span> { activeUsers.length } </span>
					</div>
					<div className="vip-real-time-collaboration-collaborators-list-header-action">
						<Button
							__next40pxDefaultSize
							icon={ close }
							iconSize={ 16 }
							label="Close Collaborators List"
							onClick={ () => setIsPopoverVisible( false ) }
						/>
					</div>
				</div>
				<div className="vip-real-time-collaboration-collaborators-list-items">
					{ activeUsers.map( ( userState ) => (
						<button
							key={ userState.clientId }
							className="vip-real-time-collaboration-collaborators-list-item"
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
							<div className="vip-real-time-collaboration-collaborators-list-item-info">
								<div className="vip-real-time-collaboration-collaborators-list-item-name">
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
