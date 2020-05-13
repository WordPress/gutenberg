/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Spinner, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuEditor from '../menu-editor';

export default function MenusEditor( { blockEditorSettings } ) {
	const { menus, hasLoadedMenus } = useSelect( ( select ) => {
		const { getMenus, hasFinishedResolution } = select( 'core' );
		return {
			menus: getMenus(),
			hasLoadedMenus: hasFinishedResolution( 'getMenus' ),
		};
	}, [] );

	const [ menuId, setMenuId ] = useState();
	const [ stateMenus, setStateMenus ] = useState();

	useEffect( () => {
		if ( menus?.length ) {
			setStateMenus( menus );
			setMenuId( menus[ 0 ].id );
		}
	}, [ menus ] );

	if ( ! hasLoadedMenus ) {
		return <Spinner />;
	}

	return (
		<>
			<Card className="edit-navigation-menus-editor__menu-selection-card">
				<CardBody>
					<SelectControl
						className="edit-navigation-menus-editor__menu-select-control"
						label={ __( 'Select navigation to edit:' ) }
						options={ stateMenus?.map( ( menu ) => ( {
							value: menu.id,
							label: menu.name,
						} ) ) }
						onChange={ ( selectedMenuId ) =>
							setMenuId( selectedMenuId )
						}
					/>
				</CardBody>
			</Card>
			{ hasLoadedMenus && (
				<MenuEditor
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ ( deletedMenu ) => {
						const newStateMenus = stateMenus.filter( ( menu ) => {
							return menu.id !== deletedMenu;
						} );
						setStateMenus( newStateMenus );
						if ( newStateMenus.length ) {
							setMenuId( newStateMenus[ 0 ].id );
						}
					} }
				/>
			) }
		</>
	);
}
