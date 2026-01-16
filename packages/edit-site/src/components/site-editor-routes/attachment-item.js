/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

export const attachmentItemRoute = {
	name: 'attachment-item',
	path: '/attachment/:postId',
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Media' ) }
				backPath="/"
				// Empty content - no sidebar list needed for attachments
				content={ null }
			/>
		),
		mobile: <Editor />,
		preview: <Editor />,
	},
};
