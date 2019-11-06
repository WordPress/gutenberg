/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';

const SettingsHeader = ( { openDocumentSettings, openBlockSettings, openNavigator, sidebarName } ) => {
	const headerButtons = [
		{
			name: 'edit-post/document',
			// translators: ARIA label for the Document sidebar tab, not selected.
			label: __( 'Document' ),
			// translators: ARIA label for the Document sidebar tab, selected.
			activeLabel: __( 'Document (selected)' ),
			onClick: openDocumentSettings,
		},
		{
			name: 'edit-post/block',
			// translators: ARIA label for the Settings Sidebar tab, not selected.
			label: __( 'Block' ),
			// translators: ARIA label for the Settings Sidebar tab, selected.
			activeLabel: __( 'Block (selected)' ),
			onClick: openBlockSettings,
		},
		{
			name: 'edit-post/navigator',
			// translators: ARIA label for the Settings Sidebar tab, not selected.
			label: __( 'Navigator' ),
			// translators: ARIA label for the Settings Sidebar tab, selected.
			activeLabel: __( 'Navigator (selected)' ),
			onClick: openNavigator,
		},
	];

	return (
		<SidebarHeader
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			{ /* Use a list so screen readers will announce how many tabs there are. */ }
			<ul>
				{ headerButtons.map( ( { name, label, activeLabel, onClick } ) => {
					const isActive = name === sidebarName;

					return (
						<li key={ name }>
							<button
								onClick={ onClick }
								className={ classnames( 'edit-post-sidebar__panel-tab', {
									'is-active': isActive,
								} ) }
								aria-label={ isActive ? activeLabel : label }
								data-label={ label }
							>
								{ label }
							</button>
						</li>
					);
				} ) }
			</ul>
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
		openNavigator() {
			openGeneralSidebar( 'edit-post/block-navigator' );
		},
	};
} )( SettingsHeader );
