/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { TabPanel } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';

const SettingsHeader = ( { openDocumentSettings, openBlockSettings, sidebarName } ) => {
	const documentAriaLabel = sidebarName === 'edit-post/document' ?
		// translators: ARIA label for the Document sidebar tab, selected.
		__( 'Document (selected)' ) :
		// translators: ARIA label for the Document sidebar tab, not selected.
		__( 'Document' );

	const blockAriaLabel = sidebarName === 'edit-post/block' ?
		// translators: ARIA label for the Settings Sidebar tab, selected.
		__( 'Block (selected)' ) :
		// translators: ARIA label for the Settings Sidebar tab, not selected.
		__( 'Block' );

	const [ selectedTabName, setSelectedTabName ] = useState( null );

	const documentSettingsName = 'edit-post-sidebar__panel-tab-documents';
	const blockSettingsName = 'edit-post-sidebar__panel-tab-block';

	const tabs = [
		{
			name: documentSettingsName,
			title: __( 'Document' ),
			ariaLabel: `${ documentAriaLabel }`,
		},
		{
			name: blockSettingsName,
			title: __( 'Block' ),
			ariaLabel: `${ blockAriaLabel }`,

		},
	];

	const onSelect = ( tabName ) => {
		setSelectedTabName( tabName );
		if ( tabName === documentSettingsName ) {
			openDocumentSettings();
		} else if ( tabName === blockSettingsName ) {
			openBlockSettings();
		}
	};

	useEffect(
		() => {
			if ( tabs.length ) {
				setSelectedTabName( tabs[ 0 ].name );
			}
		},
		[ tabs ]
	);

	return (
		<SidebarHeader
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			<TabPanel
				onSelect={ onSelect }
				tabs={ tabs }
				activeClass="is-active"
				initialTabName={ selectedTabName }
			>
				{ () => { } }
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
