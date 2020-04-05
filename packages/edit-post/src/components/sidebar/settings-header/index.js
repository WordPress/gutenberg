/**
 * WordPress dependencies
 */
import { Button, useFilters } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';

const SettingsHeader = ( {
	openDocumentSettings,
	openBlockSettings,
	sidebarName,
} ) => {
	const blockLabel = __( 'Block' );
	const documentLabel = useFilters(
		'edit-post.sidebar.settings-header.document-label',
		// translators: ARIA label for the Document sidebar tab, not selected.
		__( 'Document' )
	);

	const [ documentAriaLabel, documentActiveClass ] =
		sidebarName === 'edit-post/document'
			? // translators: ARIA label for the Document sidebar tab, selected.
			  [ sprintf( __( '%1$s (selected)' ), documentLabel ), 'is-active' ]
			: // translators: ARIA label for the Document sidebar tab, not selected.
			  [ documentLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] =
		sidebarName === 'edit-post/block'
			? // translators: ARIA label for the Settings Sidebar tab, selected.
			  [ __( 'Block (selected)' ), 'is-active' ]
			: // translators: ARIA label for the Settings Sidebar tab, not selected.
			  [ __( 'Block' ), '' ];

	/* Use a list so screen readers will announce how many tabs there are. */
	return (
		<ul>
			<li>
				<Button
					onClick={ openDocumentSettings }
					className={ `edit-post-sidebar__panel-tab ${ documentActiveClass }` }
					aria-label={ documentAriaLabel }
					data-label={ documentLabel }
				>
					{ documentLabel }
				</Button>
			</li>
			<li>
				<Button
					onClick={ openBlockSettings }
					className={ `edit-post-sidebar__panel-tab ${ blockActiveClass }` }
					aria-label={ blockAriaLabel }
					data-label={ blockLabel }
				>
					{ blockLabel }
				</Button>
			</li>
		</ul>
	);
};

export default withDispatch( ( dispatch ) => {
	const { openGeneralSidebar } = dispatch( 'core/edit-post' );
	return {
		openDocumentSettings() {
			openGeneralSidebar( 'edit-post/document' );
		},
		openBlockSettings() {
			openGeneralSidebar( 'edit-post/block' );
		},
	};
} )( SettingsHeader );
