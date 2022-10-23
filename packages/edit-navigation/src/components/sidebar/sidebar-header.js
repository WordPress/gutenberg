/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { SIDEBAR_BLOCK, SIDEBAR_MENU, SIDEBAR_SCOPE } from '../../constants';

export default function SidebarHeader( { sidebarName } ) {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const openMenuSettings = () =>
		enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_MENU );
	const openBlockSettings = () =>
		enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_BLOCK );

	const [ menuAriaLabel, menuActiveClass ] =
		sidebarName === SIDEBAR_MENU
			? // translators: ARIA label for the Menu sidebar tab, selected.
			  [ __( 'Menu (selected)' ), 'is-active' ]
			: // translators: ARIA label for the Menu Settings Sidebar tab, not selected.
			  [ __( 'Menu' ), '' ];

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
					onClick={ openMenuSettings }
					className={ `edit-navigation-sidebar__panel-tab ${ menuActiveClass }` }
					aria-label={ menuAriaLabel }
					// translators: Data label for the Menu Settings Sidebar tab.
					data-label={ __( 'Menu' ) }
				>
					{
						// translators: Text label for the Menu Settings Sidebar tab.
						__( 'Menu' )
					}
				</Button>
			</li>
			<li>
				<Button
					onClick={ openBlockSettings }
					className={ `edit-navigation-sidebar__panel-tab ${ blockActiveClass }` }
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
}
