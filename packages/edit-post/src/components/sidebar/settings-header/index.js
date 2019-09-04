/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';

const SettingsHeader = ( { openDocumentSettings, openBlockSettings, sidebarName } ) => {
	const blockLabel = __( 'Block' );
	// translators: ARIA label for the Document sidebar tab, not selected.
	const documentLabel = applyFilters( 'editor.sidebar.settingsHeader.documentLabel', __( 'Document' ) );
	const [ documentAriaLabel, documentActiveClass ] = sidebarName === 'edit-post/document' ?
		// translators: ARIA label for the Document sidebar tab, selected.
		[ `${ documentLabel } ${ __( '(selected)' ) }`, 'is-active' ] :
		[ documentLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] = sidebarName === 'edit-post/block' ?
		// translators: ARIA label for the Settings Sidebar tab, selected.
		[ __( 'Block (selected)' ), 'is-active' ] :
		// translators: ARIA label for the Settings Sidebar tab, not selected.
		[ __( 'Block' ), '' ];

	return (
		<SidebarHeader
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			{ /* Use a list so screen readers will announce how many tabs there are. */ }
			<ul>
				<li>
					<button
						onClick={ openDocumentSettings }
						className={ `edit-post-sidebar__panel-tab ${ documentActiveClass }` }
						aria-label={ documentAriaLabel }
						data-label={ documentLabel }
					>
						{ documentLabel }
					</button>
				</li>
				<li>
					<button
						onClick={ openBlockSettings }
						className={ `edit-post-sidebar__panel-tab ${ blockActiveClass }` }
						aria-label={ blockAriaLabel }
						data-label={ blockLabel }
					>
						{ blockLabel }
					</button>
				</li>
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
	};
} )( SettingsHeader );
