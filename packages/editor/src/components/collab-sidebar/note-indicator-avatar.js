/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from './utils';

/**
 * A small persistent avatar shown over a block that has an open note
 * attached, so notes are discoverable without selecting every block.
 *
 * @param {Object}   props         Component props.
 * @param {Object}   props.note    The block's primary note thread.
 * @param {Function} props.onClick Called when the avatar is activated.
 */
export default function NoteIndicatorAvatar( { note, onClick } ) {
	const avatarUrl =
		note.author_avatar_urls?.[ '48' ] || note.author_avatar_urls?.[ '96' ];

	return (
		<button
			type="button"
			className="editor-collab-sidebar__note-indicator-avatar"
			aria-label={ __( 'This block has a note' ) }
			onClick={ onClick }
		>
			<img
				src={ avatarUrl }
				alt=""
				className="editor-collab-sidebar__note-indicator-avatar-image"
				style={ { borderColor: getAvatarBorderColor( note.author ) } }
			/>
		</button>
	);
}
