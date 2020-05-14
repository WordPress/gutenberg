/**
 * WordPress dependencies
 */
import { Card, CardBody, Spinner, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuEditor from '../menu-editor';

export default function MenusEditor( {
	blockEditorSettings,
	menus,
	setMenus,
	currentMenu,
	setCurrentMenu,
} ) {
	if ( ! menus ) {
		return <Spinner />;
	}

	return (
		<>
			<Card className="edit-navigation-menus-editor__menu-selection-card">
				<CardBody>
					<SelectControl
						className="edit-navigation-menus-editor__menu-select-control"
						label={ __( 'Select navigation to edit:' ) }
						options={ menus.map( ( menu ) => ( {
							value: menu.id,
							label: menu.name,
						} ) ) }
						onChange={ ( selectedMenuId ) =>
							setCurrentMenu( selectedMenuId )
						}
					/>
				</CardBody>
			</Card>
			{ !! currentMenu && (
				<MenuEditor
					menuId={ currentMenu }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ ( deletedMenu ) => {
						const newStateMenus = menus.filter( ( menu ) => {
							return menu.id !== deletedMenu;
						} );
						setMenus( newStateMenus );
						if ( newStateMenus.length ) {
							setCurrentMenu( newStateMenus[ 0 ].id );
						}
					} }
				/>
			) }
		</>
	);
}
