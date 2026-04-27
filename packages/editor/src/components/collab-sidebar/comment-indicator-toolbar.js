/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from './utils';

const { CommentIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

const CommentAvatarIndicator = ( { onClick, thread } ) => {
	const threadParticipants = useMemo( () => {
		if ( ! thread ) {
			return [];
		}

		const participantsMap = new Map();
		const allComments = [ thread, ...thread.reply ];

		// Sort by date to show participants in chronological order.
		allComments.sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

		allComments.forEach( ( comment ) => {
			// Track thread participants (original commenter + repliers).
			if ( comment.author_name && comment.author_avatar_urls ) {
				if ( ! participantsMap.has( comment.author ) ) {
					participantsMap.set( comment.author, {
						name: comment.author_name,
						avatar:
							comment.author_avatar_urls?.[ '48' ] ||
							comment.author_avatar_urls?.[ '96' ],
						id: comment.author,
						date: comment.date,
					} );
				}
			}
		} );

		return Array.from( participantsMap.values() );
	}, [ thread ] );

	if ( ! threadParticipants.length ) {
		return null;
	}

	// If there are more than 3 participants, show 2 avatars and a "+n" number.
	const maxAvatars = 3;
	const isOverflow = threadParticipants.length > maxAvatars;
	const visibleParticipants = isOverflow
		? threadParticipants.slice( 0, maxAvatars - 1 )
		: threadParticipants;
	const overflowCount = Math.max(
		0,
		threadParticipants.length - visibleParticipants.length
	);
	const threadHasMoreParticipants = threadParticipants.length > 100;

	// If we hit the comment limit, show "100+" instead of exact overflow count.
	const overflowText =
		threadHasMoreParticipants && overflowCount > 0
			? __( '100+' )
			: sprintf(
					// translators: %s: Number of participants.
					__( '+%s' ),
					overflowCount
			  );

	return (
		<CommentIconToolbarSlotFill.Fill>
			<ToolbarButton
				className="comment-avatar-indicator"
				label={ __( 'View notes' ) }
				onClick={ () => onClick() }
				showTooltip
			>
				<Stack direction="row" align="center" gap="xs">
					{ visibleParticipants.map( ( participant ) => (
						<img
							key={ participant.id }
							src={ participant.avatar }
							alt={ participant.name }
							className="comment-avatar"
							style={ {
								borderColor: getAvatarBorderColor(
									participant.id
								),
							} }
						/>
					) ) }
					{ overflowCount > 0 && (
						<span className="editor-collab-sidebar-panel__participant-overflow">
							{ overflowText }
						</span>
					) }
				</Stack>
			</ToolbarButton>
		</CommentIconToolbarSlotFill.Fill>
	);
};

export default CommentAvatarIndicator;
