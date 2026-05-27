import { Button } from '@wordpress/components';
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
import { getAvatarUrl } from '../collaborators-overlay/get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { createCursorRegistry } from '../collaborators-overlay/cursor-registry';
import { CollaboratorsOverlay } from '../collaborators-overlay';

const { useActiveCollaborators } = unlock( privateApis );

interface CollaboratorsPresenceProps {
	postId: number | null;
	postType: string | null;
}

/**
 * Groups awareness states by WordPress user ID and returns one entry per user.
 * Priority: isMe first (preserves "You" label), then connected over disconnected,
 * then most recently entered tab.
 *
 * @param states Awareness states to deduplicate.
 */
function deduplicateByUserId(
	states: PostEditorAwarenessState[]
): PostEditorAwarenessState[] {
	const byUserId = new Map< number, PostEditorAwarenessState >();
	for ( const state of states ) {
		const userId = state.collaboratorInfo.id;
		const existing = byUserId.get( userId );
		if ( ! existing ) {
			byUserId.set( userId, state );
			continue;
		}
		const pickNew =
			( state.isMe && ! existing.isMe ) ||
			( ! state.isMe &&
				! existing.isMe &&
				( ( state.isConnected && ! existing.isConnected ) ||
					( state.isConnected === existing.isConnected &&
						state.collaboratorInfo.enteredAt >
							existing.collaboratorInfo.enteredAt ) ) );
		if ( pickNew ) {
			byUserId.set( userId, state );
		}
	}
	return Array.from( byUserId.values() );
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

	const me = activeCollaborators.find( ( c ) => c.isMe );

	// Filter by user ID (not just isMe) so the current user's other tabs don't appear as collaborators.
	const otherActiveCollaborators = deduplicateByUserId(
		activeCollaborators.filter(
			( c ) =>
				! c.isMe && c.collaboratorInfo.id !== me?.collaboratorInfo.id
		)
	);

	// Always include self in the list sorted first, one entry per WP user.
	const collaboratorsForList = useMemo( () => {
		return deduplicateByUserId( [ ...activeCollaborators ] ).sort(
			( a, b ) => {
				if ( a.isMe && ! b.isMe ) {
					return -1;
				}
				if ( ! a.isMe && b.isMe ) {
					return 1;
				}
				return 0;
			}
		);
	}, [ activeCollaborators ] );

	const [ cursorRegistry ] = useState( createCursorRegistry );

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
						collaboratorsForList.length
					) }
				>
					<AvatarGroup max={ 4 }>
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
						activeCollaborators={ collaboratorsForList }
						popoverAnchor={ popoverAnchor }
						setIsPopoverVisible={ setIsPopoverVisible }
						cursorRegistry={ cursorRegistry }
					/>
				) }
			</div>
			<CollaboratorsOverlay
				postId={ postId }
				postType={ postType }
				cursorRegistry={ cursorRegistry }
			/>
		</>
	);
}
