/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import {
	untitledMenu,
	useSelectedMenuId,
	useMenuEntityProp,
	IsMenuNameControlFocusedContext,
} from '../../hooks';

import { sprintf, __ } from '@wordpress/i18n';
export default function NameDisplay() {
	const [ menuId ] = useSelectedMenuId();
	const [ name ] = useMenuEntityProp( 'name', menuId );
	const [ , setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);

	const menuName = name ?? untitledMenu;

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					aria-label={ sprintf(
						// translators: %s: the name of a menu.
						__( `Edit menu name: %s` ),
						menuName
					) }
					onClick={ () => setIsMenuNameEditFocused( true ) }
				>
					{ menuName }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
