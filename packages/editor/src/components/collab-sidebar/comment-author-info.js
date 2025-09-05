/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Render author information for a comment.
 *
 * @param {Object} props        - Component properties.
 * @param {string} props.avatar - URL of the author's avatar.
 * @param {string} props.name   - Name of the author.
 * @param {string} props.date   - Date of the comment.
 *
 * @return {React.ReactNode} The JSX element representing the author's information.
 */
function CommentAuthorInfo( { avatar, name, date } ) {
	const dateSettings = getDateSettings();
	const [ dateTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);

	const { currentUserAvatar, currentUserName } = useSelect( ( select ) => {
		const userData = select( coreStore ).getCurrentUser();

		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		const defaultAvatar = __experimentalDiscussionSettings?.avatarURL;
		return {
			currentUserAvatar: userData?.avatar_urls[ 48 ] ?? defaultAvatar,
			currentUserName: userData?.name,
		};
	}, [] );

	const currentDate = new Date();

	return (
		<>
			<img
				src={ avatar ?? currentUserAvatar }
				className="editor-collab-sidebar-panel__user-avatar"
				// translators: alt text for user avatar image
				alt={ __( 'User avatar' ) }
				width={ 32 }
				height={ 32 }
			/>
			<VStack spacing="0">
				<span className="editor-collab-sidebar-panel__user-name">
					{ name ?? currentUserName }
				</span>
				<time
					dateTime={ dateI18n( 'c', date ?? currentDate ) }
					className="editor-collab-sidebar-panel__user-time"
				>
					{ dateI18n( dateTimeFormat, date ?? currentDate ) }
				</time>
			</VStack>
		</>
	);
}

export default CommentAuthorInfo;
