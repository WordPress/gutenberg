/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	ToolbarGroup,
	ToolbarButton,
	__experimentalText as Text,
} from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { sprintf, __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	untitledMenu,
	useSelectedMenuId,
	useMenuEntityProp,
	IsMenuNameControlFocusedContext,
} from '../../hooks';
import { SIDEBAR_SCOPE, SIDEBAR_MENU } from '../../constants';

export default function NameDisplay() {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const [ menuId ] = useSelectedMenuId();
	const [ name ] = useMenuEntityProp( 'name', menuId );
	const [ , setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);

	const menuName = decodeEntities( name ?? untitledMenu );

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					aria-label={ sprintf(
						// translators: %s: the name of a menu.
						__( `Edit menu name: %s` ),
						menuName
					) }
					onClick={ () => {
						enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_MENU );
						setIsMenuNameEditFocused( true );
					} }
				>
					<Text limit={ 24 } ellipsizeMode="tail" truncate>
						{ menuName }
					</Text>
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
