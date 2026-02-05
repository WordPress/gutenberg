import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	privateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';

import { Avatar } from './avatar';
import { CollaboratorsList } from './list';
import { unlock } from '../../lock-unlock';

import './styles/collaborators-presence.scss';

const { useActiveCollaborators } = unlock( privateApis );

interface CollaboratorsPresenceProps {
	postId: number | null;
	postType: string | null;
}

/**
 * Renders a list of avatars for the active users, with a maximum of 3 visible avatars.
 * Shows a popover with all users on hover.
 *
 * @param {Object} props          CollaboratorsPresence component props
 * @param {number} props.postId   ID of the post
 * @param {string} props.postType Type of the post
 */
export function CollaboratorsPresence( {
	postId,
	postType,
}: CollaboratorsPresenceProps ) {
	const activeUsers = useActiveCollaborators(
		postId,
		postType
	) as PostEditorAwarenessState[];

	// Filter out current user - we never show ourselves in the list
	const otherActiveUsers = activeUsers.filter( ( user ) => ! user.isMe );

	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	// When there are no other collaborators, this component should not render
	// at all. This will always be the case when collaboration is not enabled, but
	// also when the current user is the only editor with the post open.
	if ( otherActiveUsers.length === 0 ) {
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
					activeUsers={ otherActiveUsers }
					popoverAnchor={ popoverAnchor }
					setIsPopoverVisible={ setIsPopoverVisible }
				/>
			) }
		</div>
	) : null;
}
