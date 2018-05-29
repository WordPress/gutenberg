/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PostTypeSupportCheck } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import SettingsHeader from '../settings-header';
import Sidebar from '../';

const SIDEBAR_NAME = 'edit-post/extras';

const ExtrasSidebar = () => (
	<PostTypeSupportCheck supportKeys="extras">
		<Sidebar
			name={ SIDEBAR_NAME }
			label={ __( 'Editor settings' ) }
		>
			<SettingsHeader sidebarName={ SIDEBAR_NAME } />
			<Panel>
				<PanelBody className="edit-post-extra-sidebar__panel" />
			</Panel>
		</Sidebar>
	</PostTypeSupportCheck>
);

export default ExtrasSidebar;
