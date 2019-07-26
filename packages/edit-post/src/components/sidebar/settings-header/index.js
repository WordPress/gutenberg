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
	const documentAriaLabel = sidebarName === 'edit-post/document' ?
		// translators: ARIA label for the Document sidebar tab, selected.
		__( 'Document (selected)' ) :
		// translators: ARIA label for the Document sidebar tab, not selected.
		( 'Document' );

	const blockAriaLabel = sidebarName === 'edit-post/block' ?
		// translators: ARIA label for the Settings Sidebar tab, selected.
		__( 'Block (selected)' ) :
		// translators: ARIA label for the Settings Sidebar tab, not selected.
		__( 'Block' );

	const tabs = [
		{
			name: 'edit-post/document__panel-tab',
			className: 'edit-post-sidebar__panel-tab',
			title: __( 'Document' ),
			ariaLabel: `${ documentAriaLabel }`,
			onSelect: openDocumentSettings,
		},
		{
			name: 'edit-post/block__panel-tab',
			className: 'edit-post-sidebar__panel-tab',
			title: __( 'Block' ),
			ariaLabel: `${ blockAriaLabel }`,
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
				controlledTabName={ sidebarName + '__panel-tab' }
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
