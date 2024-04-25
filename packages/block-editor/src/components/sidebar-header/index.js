/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function SidebarHeader( { onClose, tabs } ) {
	return (
		<div className="block-editor-sidebar__header">
			<Button
				className="block-editor-sidebar__close-button"
				icon={ closeSmall }
				label={ __( 'Close block inserter' ) }
				onClick={ () => onClose() }
				size="small"
			/>
			<Tabs.TabList className="block-editor-sidebar__tabs-tablist">
				{ tabs.map( ( tab ) => (
					<Tabs.Tab
						key={ tab.name }
						tabId={ tab.name }
						className="block-editor-sidebar__tabs-tab"
					>
						{ tab.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
		</div>
	);
}

export default SidebarHeader;
