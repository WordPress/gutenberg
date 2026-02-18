import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	privateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

import { CollaboratorsList } from './list';
import { unlock } from '../../lock-unlock';
import { getAvatarUrl } from '../collaborators-overlay/get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

import './styles/collaborators-presence.scss';
import { CollaboratorsOverlay } from '../collaborators-overlay';

const { useActiveCollaborators } = unlock( privateApis );
const { Avatar, AvatarGroup } = unlock( componentsPrivateApis );

interface CollaboratorsPresenceProps {
	postId: number | null;
	postType: string | null;
}

/**
 * Renders a list of avatars for the active collaborators, with a maximum of 3 visible avatars.
 * Shows a popover with all collaborators on hover.
 *
 * @param props          CollaboratorsPresence component props
 * @param props.postId   ID of the post
 * @param props.postType Type of the post
 */
export function CollaboratorsPresence( {
	postId,
	postType,
}: CollaboratorsPresenceProps ) {
	const activeCollaborators = useActiveCollaborators(
		postId,
		postType
	) as PostEditorAwarenessState[];

	// Filter out current user - we never show ourselves in the list
	const otherActiveCollaborators = activeCollaborators.filter(
		( collaborator ) => ! collaborator.isMe
	);

	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);

	// When there are no other collaborators, this component should not render
	// at all. This will always be the case when collaboration is not enabled, but
	// also when the current user is the only editor with the post open.
	if ( otherActiveCollaborators.length === 0 ) {
		return null;
	}

	return (
		<>
			<div className="editor-collaborators-presence">
				<Button
					__next40pxDefaultSize
					className="editor-collaborators-presence__button"
					onClick={ () => setIsPopoverVisible( ! isPopoverVisible ) }
					isPressed={ isPopoverVisible }
					ref={ setPopoverAnchor }
					aria-label={ sprintf(
						// translators: %d: number of online collaborators.
						__( 'Collaborators list, %d online' ),
						otherActiveCollaborators.length
					) }
				>
					<AvatarGroup max={ 3 }>
						{ otherActiveCollaborators.map(
							( collaboratorState ) => (
								<Avatar
									key={ collaboratorState.clientId }
									src={ getAvatarUrl(
										collaboratorState.collaboratorInfo
											.avatar_urls
									) }
									name={
										collaboratorState.collaboratorInfo.name
									}
									borderColor={ getAvatarBorderColor(
										collaboratorState.collaboratorInfo.id
									) }
									size="small"
								/>
							)
						) }
					</AvatarGroup>
				</Button>
				{ isPopoverVisible && (
					<CollaboratorsList
						activeCollaborators={ otherActiveCollaborators }
						popoverAnchor={ popoverAnchor }
						setIsPopoverVisible={ setIsPopoverVisible }
					/>
				) }
			</div>
			<CollaboratorsOverlay postId={ postId } postType={ postType } />
		</>
	);
}
