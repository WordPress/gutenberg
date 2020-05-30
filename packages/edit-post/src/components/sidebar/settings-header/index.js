/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, useSelect } from '@wordpress/data';

const SettingsHeader = ( {
	openDocumentSettings,
	openBlockSettings,
	sidebarName,
} ) => {
	// translators: Label for the Block Settings Sidebar tab, not selected.
	const blockLabel = __( 'Block' );
	const documentLabel = useSelect( ( select ) => {
		const currentPostType = select( 'core/editor' ).getCurrentPostType();
		const postType = select( 'core' ).getPostType( currentPostType );

		// translators: Default ARIA label for the Document sidebar tab, not selected.
		const defaultDocumentLabel = __( 'Document' );

		return [ 'post', 'page' ].includes( currentPostType )
			? defaultDocumentLabel
			: get(
					postType,
					[ 'labels', 'singular_name' ],
					defaultDocumentLabel
			  );
	} );

	const [ documentAriaLabel, documentActiveClass ] =
		sidebarName === 'edit-post/document'
			? // translators: ARIA label for the Document sidebar tab, selected.
			  [ sprintf( __( '%1$s (selected)' ), documentLabel ), 'is-active' ]
			: [ documentLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] =
		sidebarName === 'edit-post/block'
			? // translators: ARIA label for the Block Settings Sidebar tab, selected.
			  [ sprintf( __( '%1$s (selected)' ), blockLabel ), 'is-active' ]
			: [ blockLabel, '' ];

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
