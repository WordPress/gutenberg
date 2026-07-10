/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from './utils';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

function ThreadParticipants( { participants } ) {
	const defaultAvatar = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings?.avatarURL;
	}, [] );

	// If there are more than 3 participants, show 2 avatars and a "+n" number.
	const maxAvatars = 3;
	const isOverflow = participants.length > maxAvatars;
	const visibleParticipants = isOverflow
		? participants.slice( 0, maxAvatars - 1 )
		: participants;
	const overflowCount = Math.max(
		0,
		participants.length - visibleParticipants.length
	);
	const threadHasMoreParticipants = participants.length > 100;

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
		<Stack direction="row" align="center" gap="xs">
			{ visibleParticipants.map( ( participant ) => (
				<img
					key={ participant.id }
					src={ participant.avatar || defaultAvatar }
					alt={ participant.name }
					className="editor-note-indicator__avatar"
					style={ {
						borderColor: getAvatarBorderColor( participant.id ),
					} }
				/>
			) ) }
			{ overflowCount > 0 && (
				<span className="editor-note-indicator__overflow">
					{ overflowText }
				</span>
			) }
		</Stack>
	);
}

export function NoteAvatarIndicator( { onClick, note } ) {
	const threadParticipants = useMemo( () => {
		if ( ! note ) {
			return [];
		}

		// Track thread participants (original author + repliers), sorted by
		// date so they appear in chronological order.
		const participantsMap = new Map();
		const allNotes = [ note, ...note.reply ].sort(
			( a, b ) => new Date( a.date ) - new Date( b.date )
		);

		for ( const entry of allNotes ) {
			if ( ! entry.author_name || participantsMap.has( entry.author ) ) {
				continue;
			}

			participantsMap.set( entry.author, {
				id: entry.author,
				name: entry.author_name,
				avatar:
					entry.author_avatar_urls?.[ '48' ] ||
					entry.author_avatar_urls?.[ '96' ],
			} );
		}

		return Array.from( participantsMap.values() );
	}, [ note ] );

	if ( ! threadParticipants.length ) {
		return null;
	}

	return (
		<NoteIconToolbarSlotFill.Fill>
			<ToolbarButton
				className="editor-note-indicator"
				label={ __( 'View notes' ) }
				onClick={ () => onClick() }
				showTooltip
			>
				<ThreadParticipants participants={ threadParticipants } />
			</ToolbarButton>
		</NoteIconToolbarSlotFill.Fill>
	);
}
