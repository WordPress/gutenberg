/**
 * External dependencies
 */
import { forEach, find, pick } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { Spinner, SelectControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MenuSelectControl = ( { onChange, menus, menusList, location } ) => {
	const [ menuId, setMenuId ] = useState( 0 );

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
		<form
			onSubmit={ ( e ) => {
				e.preventDefault();
				forEach( locationsData, ( menuId, location ) => {
					saveMenu( {
						...pick( find( menus, { id: parseInt( menuId ) } ), [
							'id',
							'name',
						] ),
						locations: [ location ],
					} );
				} );
			} }
		>
			{ menuLocations && (
				<table>
					{ menuLocations.map(
						( menuLocation ) =>
							menus && (
								<tr>
									<td>{ menuLocation.description }</td>
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
	);
}
