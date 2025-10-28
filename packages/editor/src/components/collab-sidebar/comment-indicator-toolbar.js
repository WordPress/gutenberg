/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
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

	// Show up to 3 avatars, with overflow indicator.
	const maxAvatars = 3;
	const visibleParticipants = threadParticipants.slice( 0, maxAvatars );
	const overflowCount = Math.max( 0, threadParticipants.length - maxAvatars );
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

	const overflowTitle =
		threadHasMoreParticipants && overflowCount > 0
			? __( '100+ participants' )
			: sprintf(
					// translators: %s: Number of participants.
					_n(
						'+%s more participant',
						'+%s more participants',
						overflowCount
					),
					overflowCount
			  );

	return (
		<CommentIconToolbarSlotFill.Fill>
			<ToolbarButton
				className="comment-avatar-indicator"
				label={ __( 'View notes' ) }
				onClick={ onClick }
				showTooltip
			>
				<div className="comment-avatar-stack">
					{ visibleParticipants.map( ( participant, index ) => (
						<img
							key={ participant.id }
							src={ participant.avatar }
							alt={ participant.name }
							className="comment-avatar"
							style={ {
								zIndex: maxAvatars - index,
								borderColor: getAvatarBorderColor(
									participant.id
								),
							} }
						/>
					) ) }
					{ overflowCount > 0 && (
						<div
							className="comment-avatar-overflow"
							style={ { zIndex: 0 } }
							title={ overflowTitle }
						>
							{ overflowText }
						</div>
					) }
				</div>
			</ToolbarButton>
		</CommentIconToolbarSlotFill.Fill>
	);
};

export default CommentAvatarIndicator;
