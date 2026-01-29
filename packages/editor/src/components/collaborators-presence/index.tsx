import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { privateApis } from '@wordpress/core-data';

import { Avatar } from './avatar';
import { CollaboratorsList } from './list';
import { unlock } from '../../lock-unlock';
// import { type CursorRegistry } from '@/utilities/cursor-registry';

import './styles/collaborators-presence.scss';

const { useActiveUsers } = unlock( privateApis );

interface UserInfo {
	name: string;
	color: string;
	avatar_urls?: Record< string, string >;
}

interface UserState {
	clientId: string;
	isMe: boolean;
	userInfo: UserInfo;
}

interface AvatarsProps {
	// cursorRegistry: CursorRegistry;
	postId: number | null;
	postType: string | null;
}

/**
 * Renders a list of avatars for the active users, with a maximum of 3 visible avatars.
 * Shows a popover with all users on hover.
 * @param root0
 * @param root0.postId
 * @param root0.postType
 */
export function CollaboratorsPresence( {
	// cursorRegistry,
	postId,
	postType,
}: AvatarsProps ) {
	const activeUsers = useActiveUsers( postId, postType ) as UserState[];

	// Filter out current user - we never show ourselves in the list
	const otherActiveUsers = activeUsers.filter( ( user ) => ! user.isMe );

	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	if ( otherActiveUsers.length === 0 ) {
		// Hide avatars when there are no other users
		return null;
	}

	const visibleUsers = otherActiveUsers.slice( 0, 3 );
	const remainingUsers = otherActiveUsers.slice( 3 );
	const remainingUsersText = remainingUsers
		.map( ( { userInfo } ) => userInfo.name )
		.join( ', ' );

	return visibleUsers.length > 0 ? (
		<div className="editor-collaborators-presence">
			<Button
				__next40pxDefaultSize
				className="editor-collaborators-presence__button"
				onClick={ () => setIsPopoverVisible( ! isPopoverVisible ) }
				isPressed={ isPopoverVisible }
				ref={ setPopoverAnchor }
				aria-label={ `Collaborators list, ${ otherActiveUsers.length } online` }
			>
				{ visibleUsers.map( ( userState ) => (
					<Avatar
						key={ userState.clientId }
						userInfo={ userState.userInfo }
						showUserColorBorder={ false }
						size="small"
					/>
				) ) }

				{ remainingUsers.length > 0 && (
					<div
						className="editor-collaborators-presence__remaining"
						title={ remainingUsersText }
					>
						+{ remainingUsers.length }
					</div>
				) }
			</Button>
			{ isPopoverVisible && (
				<CollaboratorsList
					activeUsers={ otherActiveUsers.map( ( user ) => ( {
						clientId: user.clientId,
						isConnected: true,
						userInfo: user.userInfo,
					} ) ) }
					// cursorRegistry={ cursorRegistry }
					popoverAnchor={ popoverAnchor }
					setIsPopoverVisible={ setIsPopoverVisible }
				/>
			) }
		</div>
	) : null;
}
