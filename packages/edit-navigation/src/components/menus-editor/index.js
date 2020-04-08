/**
 * External dependencies
 */
import { filter } from 'lodash';
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
	const menus = useSelect( ( select ) => select( 'core' ).getMenus() );

	const [ menuId, setMenuId ] = useState( 0 );
	const [ stateMenus, setStateMenus ] = useState( false );

	useEffect( () => {
		if ( menus?.length ) {
			setStateMenus( menus );
			setMenuId( menus[ 0 ].id );
		}
	}, [ menus ] );

	if ( ! stateMenus ) {
		return <Spinner />;
	}

	return (
		<>
			<Card className="edit-navigation-menus-editor__menu-selection-card">
				<CardBody>
					<SelectControl
						className="edit-navigation-menus-editor__menu-select-control"
						label={ __( 'Select navigation to edit:' ) }
						options={ stateMenus.map( ( menu ) => ( {
							value: menu.id,
							label: menu.name,
						} ) ) }
						onChange={ ( selectedMenuId ) =>
							setMenuId( selectedMenuId )
						}
					/>
				</CardBody>
			</Card>
			{ !! menuId && (
				<MenuEditor
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDelete={ ( deletedMenu ) => {
						const newStateMenus = filter( stateMenus, ( menu ) => {
							return menu.id !== deletedMenu.id;
						} );
						setStateMenus( newStateMenus );
						setMenuId( newStateMenus[ 0 ].id );
					} }
				/>
			) }
		</>
	);
}
