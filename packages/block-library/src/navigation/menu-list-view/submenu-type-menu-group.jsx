import { MenuGroup, MenuItem } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addSubmenu, link, page } from '@wordpress/icons';

/**
 * The kinds of submenu to choose from (#86178): what its own label links to.
 * Shared by the add button's "Submenu" step and "Create submenu" in an item's
 * options menu, so both offer the same choice.
 *
 * @param {Object}                                       props
 * @param {(type: 'page'|'custom'|'label-only') => void} props.onChoose Called with the choice.
 * @param {Object}                                       ref            Ref for the first option.
 */
function SubmenuTypeMenuGroup( { onChoose }, ref ) {
	return (
		<MenuGroup>
			<MenuItem
				ref={ ref }
				icon={ page }
				onClick={ () => onChoose( 'page' ) }
			>
				{ __( 'Existing page' ) }
			</MenuItem>
			<MenuItem icon={ link } onClick={ () => onChoose( 'custom' ) }>
				{ __( 'Custom link' ) }
			</MenuItem>
			<MenuItem
				icon={ addSubmenu }
				onClick={ () => onChoose( 'label-only' ) }
			>
				{ __( 'Label only' ) }
			</MenuItem>
		</MenuGroup>
	);
}

export default forwardRef( SubmenuTypeMenuGroup );
