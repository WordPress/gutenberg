/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';

const SettingsHeader = ( { openDocumentSettings, openBlockSettings, sidebarName } ) => {
	const tabs = [
		{
			name: 'edit-post/document',
			className: 'edit-post-sidebar__panel-tab',
			title: __( 'Document' ),
			ariaLabel: __( 'Document' ),
			onSelect: openDocumentSettings,
		},
		{
			name: 'edit-post/block',
			className: 'edit-post-sidebar__panel-tab',
			title: __( 'Block' ),
			ariaLabel: __( 'Block' ),
			onSelect: openBlockSettings,
		},
	];

	return (
		<SidebarHeader
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			<TabPanel
				tabs={ tabs }
				controlledTabName={ sidebarName }
			>
			</TabPanel>
		</SidebarHeader>
	);
};

export default withDispatch( ( dispatch ) => {
	const { openGeneralSidebar } = dispatch( 'core/edit-post' );
	const { clearSelectedBlock } = dispatch( 'core/block-editor' );
	return {
		openDocumentSettings() {
			openGeneralSidebar( 'edit-post/document' );
			clearSelectedBlock();
		},
		openBlockSettings() {
			openGeneralSidebar( 'edit-post/block' );
		},
	};
} )( SettingsHeader );
