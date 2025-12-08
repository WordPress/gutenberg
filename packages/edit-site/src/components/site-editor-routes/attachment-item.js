/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

export const attachmentItemRoute = {
	name: 'attachment-item',
	path: '/attachment/:postId',
	areas: {
		sidebar() {
			return (
				<SidebarNavigationScreen
					title={ __( 'Media' ) }
					backPath="/"
					content={
						<DataViewsSidebarContent postType="attachment" />
					}
				/>
			);
		},
		mobile() {
			return <Editor />;
		},
		preview() {
			return <Editor />;
		},
	},
};
