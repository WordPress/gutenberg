import { useMemo, useState } from '@wordpress/element';
import {
	privateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

import Avatar from './avatar';
import AvatarGroup from './avatar-group';
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

	const otherActiveCollaborators = activeCollaborators.filter(
		( c ) => ! c.isMe
	);

	// Always include self in the list sorted first.
	const collaboratorsForList = useMemo( () => {
		return [ ...activeCollaborators ].sort( ( a, b ) => {
			if ( a.isMe && ! b.isMe ) {
				return -1;
			}
			if ( ! a.isMe && b.isMe ) {
				return 1;
			}
			return 0;
		} );
	}, [ activeCollaborators ] );

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

	const me = activeCollaborators.find( ( c ) => c.isMe );

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
						{ me && (
							<Avatar
								key={ me.clientId }
								src={ getAvatarUrl(
									me.collaboratorInfo.avatar_urls
								) }
								name={ me.collaboratorInfo.name }
								borderColor="var(--wp-admin-theme-color)"
								size="small"
							/>
						) }
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
				) }
			</Button>
			<CollaboratorsOverlay postId={ postId } postType={ postType } />
				<CollaboratorsList
					activeCollaborators={ otherActiveCollaborators }
}
