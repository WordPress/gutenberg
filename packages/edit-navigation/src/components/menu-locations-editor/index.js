/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { Spinner, SelectControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const LocatioWithMenu = ( { onChange, menus, menusList, location } ) => {
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

	if ( ! menus || ! menuLocations ) {
		return <Spinner />;
	}

	const [ locationsData, setLocationsData ] = useSate( null );

	const setLocations = ( { location, menu } ) => {
		console.log( location, menu );
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
										<LocatioWithMenu
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
