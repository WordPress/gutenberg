/**
 * External dependencies
 */
import { find, pick } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	Button,
	Panel,
	PanelBody,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MenuSelectControl = ( { onChange, menus, menusList, location } ) => {
	const [ menuId, setMenuId ] = useState( false );

	return (
		<>
			{ menus && (
				<SelectControl
					options={ menusList }
					value={ menuId || location.menu }
					onChange={ ( selectedMenuId ) => {
						setMenuId( selectedMenuId );
						onChange( {
							location: location.name,
							menu: selectedMenuId,
						} );
					} }
				/>
			) }
		</>
	);
};

export default function MenuLocationsEditor() {
	const menus = useSelect( ( select ) => select( 'core' ).getMenus() );
	const menuLocations = useSelect( ( select ) =>
		select( 'core' ).getMenuLocations()
	);
	const [ locationsData, setLocationsData ] = useState( {} );
	const { saveMenu } = useDispatch( 'core' );

	if ( ! menus || ! menuLocations ) {
		return <Spinner />;
	}

	const setLocations = ( { location, menu } ) => {
		locationsData[ location ] = menu;
		setLocationsData( locationsData );
	};

	const saveLocations = async () => {
		for ( const location of Object.keys( locationsData ) ) {
			const menuId = locationsData[ location ];
			await saveMenu( {
				...pick( find( menus, { id: parseInt( menuId ) } ), [
					'id',
					'name',
				] ),
				locations: [ location ],
			} );
		}
	};

	const menusList =
		menus &&
		menus.map( ( menu ) => ( {
			value: menu.id,
			label: menu.name,
		} ) );

	menusList.push( {
		value: 0,
		label: __( '— Select a Menu —' ),
	} );

	return (
		<Panel className="edit-navigation-menu-editor__panel">
			<PanelBody title={ __( 'Menu locations' ) }>
				<form
					onSubmit={ ( e ) => {
						e.preventDefault();
						saveLocations();
					} }
				>
					{ menuLocations && (
						<table>
							{ menuLocations.map(
								( menuLocation ) =>
									menus && (
										<tr>
											<td>
												{ menuLocation.description }
											</td>
											<td>
												<MenuSelectControl
													menus={ menus }
													menusList={ menusList }
													key={ menuLocation.name }
													location={ menuLocation }
													onChange={ setLocations }
												/>
											</td>
										</tr>
									)
							) }
						</table>
					) }
					<Button type="submit" isPrimary>
						{ __( 'Save' ) }
					</Button>
				</form>
			</PanelBody>
		</Panel>
	);
}
