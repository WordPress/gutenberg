/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

// translators: Label for the Block Settings Sidebar tab, not selected.
const BLOCK_LABEL = __( 'Block' );
// translators: Label for the Block Settings Sidebar tab, selected.
const BLOCK_SELECTED_LABEL = __( 'Block (selected)' );

const SettingsHeader = ( { sidebarName } ) => {
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );

	const documentLabel = useSelect( ( select ) => {
		const currentPostType = select( 'core/editor' ).getCurrentPostType();
		const postType = select( 'core' ).getPostType( currentPostType );

		// translators: Default label for the Document sidebar tab, not selected.
		const defaultDocumentLabel = __( 'Document' );

		return get(
			postType,
			[ 'labels', 'singular_name' ],
			defaultDocumentLabel
		);
	} );

	const [ documentAriaLabel, documentActiveClass ] =
		sidebarName === 'edit-post/document'
			? // translators: ARIA label for the Document sidebar tab, selected.
			  [ sprintf( __( '%s (selected)' ), documentLabel ), 'is-active' ]
			: [ documentLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] =
		sidebarName === 'edit-post/block'
			? [ BLOCK_SELECTED_LABEL, 'is-active' ]
			: [ BLOCK_LABEL, '' ];

	/* Use a list so screen readers will announce how many tabs there are. */
	return (
		<ul>
			<li>
				<Button
					onClick={ () => openGeneralSidebar( 'edit-post/document' ) }
					className={ `edit-post-sidebar__panel-tab ${ documentActiveClass }` }
					aria-label={ documentAriaLabel }
					data-label={ documentLabel }
				>
					{ documentLabel }
				</Button>
			</li>
			<li>
				<Button
					onClick={ () => openGeneralSidebar( 'edit-post/block' ) }
					className={ `edit-post-sidebar__panel-tab ${ blockActiveClass }` }
					aria-label={ blockAriaLabel }
					data-label={ BLOCK_LABEL }
				>
					{ BLOCK_LABEL }
				</Button>
			</li>
		</ul>
	);
};

export default SettingsHeader;
