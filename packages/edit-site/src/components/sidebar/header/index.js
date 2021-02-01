/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../../store/constants';
import { SIDEBAR_BLOCK, SIDEBAR_TEMPLATE } from '../constants';

const SettingsHeader = ( { sidebarName } ) => {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const openDocumentSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_TEMPLATE );
	const openBlockSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );

	const templateLabel = __( 'Template' );

	const [ documentAriaLabel, documentActiveClass ] =
		sidebarName === SIDEBAR_TEMPLATE
			? // translators: ARIA label for the Template sidebar tab, selected. %s: Template label.
			  [ sprintf( __( '%s (selected)' ), templateLabel ), 'is-active' ]
			: [ templateLabel, '' ];

	const [ blockAriaLabel, blockActiveClass ] =
		sidebarName === SIDEBAR_BLOCK
			? // translators: ARIA label for the Block Settings Sidebar tab, selected.
			  [ __( 'Block (selected)' ), 'is-active' ]
			: // translators: ARIA label for the Block Settings Sidebar tab, not selected.
			  [ __( 'Block' ), '' ];

	/* Use a list so screen readers will announce how many tabs there are. */
	return (
		<ul>
			<li>
				<Button
					onClick={ openDocumentSettings }
					className={ `edit-site-sidebar__panel-tab ${ documentActiveClass }` }
					aria-label={ documentAriaLabel }
					data-label={ templateLabel }
				>
					{ templateLabel }
				</Button>
			</li>
			<li>
				<Button
					onClick={ openBlockSettings }
					className={ `edit-site-sidebar__panel-tab ${ blockActiveClass }` }
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
