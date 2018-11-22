/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';

const SettingsHeader = ( { openDocumentSettings, openBlockSettings, sidebarName } ) => {
	const blockLabel = __( 'Block' );
	const [ documentAriaLabel, documentActiveClass ] = sidebarName === 'edit-post/document' ?
		// translators: ARIA label for the Document Settings sidebar tab, selected.
		[ __( 'Document settings (selected)' ), 'is-active' ] :
		// translators: ARIA label for the Document Settings sidebar tab, not selected.
		[ __( 'Document settings' ), '' ];

	const [ blockAriaLabel, blockActiveClass ] = sidebarName === 'edit-post/block' ?
		// translators: ARIA label for the Block Settings sidebar tab, selected.
		[ __( 'Block settings (selected)' ), 'is-active' ] :
		// translators: ARIA label for the Block Settings sidebar tab, not selected.
		[ __( 'Block settings' ), '' ];

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
						data-label={ __( 'Document' ) }
					>
						{ __( 'Document' ) }
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
	const { clearSelectedBlock } = dispatch( 'core/editor' );
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
