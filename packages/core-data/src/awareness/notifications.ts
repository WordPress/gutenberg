import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { UserInfo } from './types';

export enum NotificationType {
	PostUpdated = 'remote-user-post-updated',
}

/**
 * Get the content of a post updated or draft saved notification.
 *
 * @param userInfo the user info of the user related to the notification
 * @param status   the status of the post
 * @return the content of the post updated or draft saved notification
 */
function getPostUpdatedNotificationContent(
	userInfo: UserInfo,
	status: string
): string {
	let noun = 'Draft';
	let verb = 'saved';

	if ( [ 'future', 'private', 'publish' ].includes( status ) ) {
		noun = 'Post';
		verb = 'updated';
	}

	return `${ noun } ${ verb } by ${ userInfo.name }.`;
}

/**
 * Get the content for a notification type.
 *
 * @param  userInfo the user info of the user related to the notification
 * @param  type     the type of notification
 * @param  status   the status of the post
 * @return {string} the content for the notification type
 */
function getContentForNotificationType(
	userInfo: UserInfo,
	type: NotificationType,
	status?: string
): string {
	switch ( type ) {
		case NotificationType.PostUpdated:
			return getPostUpdatedNotificationContent( userInfo, status ?? '' );
		default:
			return '';
	}
}

/**
 * Send a notification to the editor.
 *
 * Certain notifications can be skipped based on user settings, or scenarios.
 *
 * @param type                The type of notification to send.
 * @param userInfoToSendAbout The user info of the user related to the notification.
 * @param status              The status of the post (only relevant for PostUpdated notifications).
 */
export function sendNotification(
	type: NotificationType,
	userInfoToSendAbout: UserInfo,
	status?: string
): void {
	// This is done on purpose, to allow tests to be written without noticesStore.
	const { createNotice } = dispatch( noticesStore );

	// Get the content for the notification type.
	const content = getContentForNotificationType(
		userInfoToSendAbout,
		type,
		status
	);

	// Send the notification, via a notice.
	void createNotice( 'info', content, {
		id: `${ type }-${ userInfoToSendAbout.id }`,
		isDismissible: false,
		type: 'snackbar',
	} );
}
