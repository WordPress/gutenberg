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

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

export function NoteAvatarIndicator( { onClick, note } ) {
	const threadParticipants = useMemo( () => {
		if ( ! note ) {
			return [];
		}

		const participantsMap = new Map();
		const allNotes = [ note, ...note.reply ];

		// Sort by date to show participants in chronological order.
		allNotes.sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

		allNotes.forEach( ( entry ) => {
			// Track thread participants (original author + repliers).
			if ( entry.author_name && entry.author_avatar_urls ) {
				if ( ! participantsMap.has( entry.author ) ) {
					participantsMap.set( entry.author, {
						name: entry.author_name,
						avatar:
							entry.author_avatar_urls?.[ '48' ] ||
							entry.author_avatar_urls?.[ '96' ],
						id: entry.author,
						date: entry.date,
					} );
				}
			}
		} );

		return Array.from( participantsMap.values() );
	}, [ note ] );

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

	// If we hit the note limit, show "100+" instead of exact overflow count.
	const overflowText =
		threadHasMoreParticipants && overflowCount > 0
			? __( '100+' )
			: sprintf(
					// translators: %s: Number of participants.
					__( '+%s' ),
					overflowCount
			  );

	return (
		<NoteIconToolbarSlotFill.Fill>
			<ToolbarButton
				className="editor-note-indicator"
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
							className="editor-note-indicator__avatar"
							style={ {
								borderColor: getAvatarBorderColor(
									participant.id
								),
							} }
						/>
					) ) }
					{ overflowCount > 0 && (
						<span className="editor-note-indicator__overflow">
							{ overflowText }
						</span>
					) }
				</Stack>
			</ToolbarButton>
		</NoteIconToolbarSlotFill.Fill>
	);
}
