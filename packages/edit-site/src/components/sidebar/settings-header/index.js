/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../../store/constants';
import { SIDEBAR_BLOCK, SIDEBAR_TEMPLATE } from '../constants';

const SettingsHeader = ( { sidebarName } ) => {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const openTemplateSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_TEMPLATE );
	const openBlockSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );

	const [ templateAriaLabel, templateActiveClass ] =
		sidebarName === SIDEBAR_TEMPLATE
			? // translators: ARIA label for the Template sidebar tab, selected.
			  [ __( 'Template (selected)' ), 'is-active' ]
			: // translators: ARIA label for the Template Settings Sidebar tab, not selected.
			  [ __( 'Template' ), '' ];

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
					onClick={ openTemplateSettings }
					className={ `edit-site-sidebar__panel-tab ${ templateActiveClass }` }
					aria-label={ templateAriaLabel }
					// translators: Data label for the Template Settings Sidebar tab.
					data-label={ __( 'Template' ) }
				>
					{
						// translators: Text label for the Template Settings Sidebar tab.
						__( 'Template' )
					}
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
