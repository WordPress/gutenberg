import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	privateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

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
 * Renders a list of avatars for the active collaborators, with a maximum of 3 visible avatars.
 * Shows a popover with all collaborators on hover.
 *
 * @param {Object} props          CollaboratorsPresence component props
 * @param {number} props.postId   ID of the post
 * @param {string} props.postType Type of the post
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

	const visibleCollaborators = otherActiveCollaborators.slice( 0, 3 );
	const remainingCollaborators = otherActiveCollaborators.slice( 3 );
	const remainingCollaboratorsText = remainingCollaborators
		.map( ( { collaboratorInfo } ) => collaboratorInfo.name )
		.join( ', ' );

	return visibleCollaborators.length > 0 ? (
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
				{ visibleCollaborators.map( ( collaboratorState ) => (
					<Avatar
						key={ collaboratorState.clientId }
						collaboratorInfo={ collaboratorState.collaboratorInfo }
						showCollaboratorColorBorder={ false }
						size="small"
					/>
				) ) }

				{ remainingCollaborators.length > 0 && (
					<div
						className="editor-collaborators-presence__remaining"
						title={ remainingCollaboratorsText }
					>
						+{ remainingCollaborators.length }
					</div>
				) }
			</Button>
			{ isPopoverVisible && (
				<CollaboratorsList
					activeCollaborators={ otherActiveCollaborators }
					popoverAnchor={ popoverAnchor }
					setIsPopoverVisible={ setIsPopoverVisible }
				/>
			) }
		</div>
	) : null;
}
