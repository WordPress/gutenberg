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
	const [ documentAriaLabel, documentSettingsActive ] = sidebarName === 'edit-post/document' ?
		// translators: ARIA label for the Document sidebar tab, selected.
		[ __( 'Document (selected)' ), true ] :
		// translators: ARIA label for the Document sidebar tab, not selected.
		[ __( 'Document' ), false ];

	const [ blockAriaLabel, blockSettingsActive ] = sidebarName === 'edit-post/block' ?
		// translators: ARIA label for the Settings Sidebar tab, selected.
		[ __( 'Block (selected)' ), true ] :
		// translators: ARIA label for the Settings Sidebar tab, not selected.
		[ __( 'Block' ), false ];

	const documentSettingsName = 'edit-post-settings__panel-tab-document';
	const blockSettingsName = 'edit-post-settings__panel-tab-block';

	const [ selectedTabName, setSelectedTabName ] = useState( documentSettingsName );

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
			if ( documentSettingsName ) {
				setSelectedTabName( documentSettingsName );
			}
		}, [ documentSettingsActive ]
	);

	useEffect(
		() => {
			if ( blockSettingsActive ) {
				setSelectedTabName( blockSettingsName );
			}
		}, [ blockSettingsActive ]
	);

	return (
		<SidebarHeader
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			<TabPanel
				key={ selectedTabName }
				tabs={ tabs }
				onSelect={ onSelect }
				selectedTabName={ selectedTabName }
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
