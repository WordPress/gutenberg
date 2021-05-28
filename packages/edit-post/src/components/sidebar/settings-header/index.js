/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const SettingsHeader = ( { sidebarName } ) => {
	const { openGeneralSidebar } = useDispatch( editPostStore );
	const openDocumentSettings = () =>
		openGeneralSidebar( 'edit-post/document' );
	const openBlockSettings = () => openGeneralSidebar( 'edit-post/block' );

	const { documentLabel, isTemplateMode } = useSelect( ( select ) => {
		const currentPostType = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( currentPostType );

		return {
			documentLabel:
				// Disable reason: Post type labels object is shaped like this.
				// eslint-disable-next-line camelcase
				postType?.labels?.singular_name ??
				// translators: Default label for the Document sidebar tab, not selected.
				__( 'Document' ),
			isTemplateMode: select( editPostStore ).isEditingTemplate(),
		};
	}, [] );

	const [ documentAriaLabel, documentActiveClass ] =
		sidebarName === 'edit-post/document'
			? // translators: ARIA label for the Document sidebar tab, selected. %s: Document label.
			  [ sprintf( __( '%s (selected)' ), documentLabel ), 'is-active' ]
			: [ documentLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] =
		sidebarName === 'edit-post/block'
			? // translators: ARIA label for the Block Settings Sidebar tab, selected.
			  [ __( 'Block (selected)' ), 'is-active' ]
			: // translators: ARIA label for the Block Settings Sidebar tab, not selected.
			  [ __( 'Block' ), '' ];

	const [ templateAriaLabel, templateActiveClass ] =
		sidebarName === 'edit-post/document'
			? [ __( 'Template (selected)' ), 'is-active' ]
			: [ __( 'Template' ), '' ];

	/* Use a list so screen readers will announce how many tabs there are. */
	return (
		<ul>
			{ ! isTemplateMode && (
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
			) }
			{ isTemplateMode && (
				<li>
					<Button
						onClick={ openDocumentSettings }
						className={ `edit-post-sidebar__panel-tab ${ templateActiveClass }` }
						aria-label={ templateAriaLabel }
						data-label={ __( 'Template' ) }
					>
						{ __( 'Template' ) }
					</Button>
				</li>
			) }
			<li>
				<Button
					onClick={ openBlockSettings }
					className={ `edit-post-sidebar__panel-tab ${ blockActiveClass }` }
					aria-label={ blockAriaLabel }
					// translators: Data label for the Block Settings Sidebar tab.
					data-label={ __( 'Block' ) }
				>
					{
						// translators: Text label for the Block Settings Sidebar tab.
						__( 'Block' )
					}
				</Button>
			</li>
		</ul>
	);
};

export default SettingsHeader;
