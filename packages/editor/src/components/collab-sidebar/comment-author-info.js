/**
 * WordPress dependencies
 */
import { Tooltip, __experimentalVStack as VStack } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	dateI18n,
	getSettings as getDateSettings,
	humanTimeDiff,
	getDate,
} from '@wordpress/date';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from './utils';

/**
 * Render author information for a comment.
 *
 * @param {Object} props        - Component properties.
 * @param {string} props.avatar - URL of the author's avatar.
 * @param {string} props.name   - Name of the author.
 * @param {string} props.date   - Date of the comment.
 * @param {string} props.userId - User ID of the author.
 *
 * @return {React.ReactNode} The JSX element representing the author's information.
 */
function CommentAuthorInfo( { avatar, name, date, userId } ) {
	const dateSettings = getDateSettings();
	const {
		currentUserAvatar,
		currentUserName,
		currentUserId,
		dateFormat = dateSettings.formats.date,
	} = useSelect( ( select ) => {
		const { getCurrentUser, getEntityRecord } = select( coreStore );
		const { getSettings } = select( blockEditorStore );
		const userData = getCurrentUser();
		const { __experimentalDiscussionSettings } = getSettings();
		const defaultAvatar = __experimentalDiscussionSettings?.avatarURL;
		const siteSettings = getEntityRecord( 'root', 'site' );
		return {
			currentUserAvatar: userData?.avatar_urls?.[ 48 ] ?? defaultAvatar,
			currentUserName: userData?.name,
			currentUserId: userData?.id,
			dateFormat: siteSettings?.date_format,
		};
	}, [] );

	const commentDate = getDate( date );
	const commentDateTime = dateI18n( 'c', commentDate );
	const shouldShowHumanTimeDiff =
		Math.floor( ( new Date() - commentDate ) / ( 1000 * 60 * 60 * 24 ) ) <
		30;

	const commentDateText = shouldShowHumanTimeDiff
		? humanTimeDiff( commentDate )
		: dateI18n( dateFormat, commentDate );

	const tooltipText = dateI18n(
		// translators: Use a non-breaking space between 'g:i' and 'a' if appropriate.
		_x( 'F j, Y g:i\xa0a', 'Note date full date format' ),
		date
	);

	return (
		<>
			<img
				src={ avatar || currentUserAvatar }
				className="editor-collab-sidebar-panel__user-avatar"
				// translators: alt text for user avatar image
				alt={ __( 'User avatar' ) }
				width={ 32 }
				height={ 32 }
				style={ {
					borderColor: getAvatarBorderColor(
						userId ?? currentUserId
					),
				} }
			/>
			<VStack spacing="0">
				<span className="editor-collab-sidebar-panel__user-name">
					{ name ?? currentUserName }
				</span>
				{ date && (
					<Tooltip placement="top" text={ tooltipText }>
						<time
							dateTime={ commentDateTime }
							className="editor-collab-sidebar-panel__user-time"
						>
							{ commentDateText }
						</time>
					</Tooltip>
				) }
			</VStack>
		</>
	);
}

export default CommentAuthorInfo;
