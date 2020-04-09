/**
 * External dependencies
 */
import { map, remove, find, pick, groupBy } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Panel,
	PanelBody,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MenuSelectControl = ( { onChange, menusList, location } ) => {
	const [ menuId, setMenuId ] = useState( false );

	useEffect( () => {
		setMenuId( location.menu );
	}, [ location.menu ] );

	return (
		<SelectControl
			options={ menusList }
			value={ menuId }
			onChange={ ( selectedMenuId ) => {
				onChange( menuId, {
					location: location.name,
					menu: parseInt( selectedMenuId ),
				} );
				setMenuId( selectedMenuId );
			} }
		/>
	);
};

export default function MenuLocationsEditor() {
	const menus = useSelect( ( select ) => select( 'core' ).getMenus() );
	const menuLocations = useSelect( ( select ) =>
		select( 'core' ).getMenuLocations()
	);
	const [ locationsData, setLocationsData ] = useState( {} );
	const { saveMenu } = useDispatch( 'core' );

	useEffect( () => {
		if ( menus && menuLocations ) {
			const locations = groupBy( menuLocations, 'menu' );
			map( locations, ( location, menuId ) => {
				locations[ menuId ] = map( location, 'name' );
			} );
			setLocationsData( locations );
		}
	}, [ menuLocations ] );

	if ( ! menus || ! menuLocations ) {
		return <Spinner />;
	}

	const setLocations = ( prevMenuId, { location, menu } ) => {
		remove( locationsData[ prevMenuId ], ( oldLocation ) => {
			return oldLocation === location;
		} );
		if ( locationsData[ menu ] ) {
			locationsData[ menu ].push( location );
		} else {
			locationsData[ menu ] = [ location ];
		}
		setLocationsData( locationsData );
	};

	const saveLocations = async () => {
		for ( const menuId in locationsData ) {
			if ( locationsData.hasOwnProperty( menuId ) ) {
				const intMenuId = parseInt( menuId );
				if ( intMenuId ) {
					await saveMenu( {
						...pick( find( menus, { id: intMenuId } ), [
							'id',
							'name',
						] ),
						locations: locationsData[ menuId ],
					} );
				}
			}
		}
	};

	const menusList = [
		{ value: 0, label: __( '— Select a Menu —' ) },
		...menus.map( ( menu ) => ( {
			value: menu.id,
			label: menu.name,
		} ) ),
	];

	return (
		<Panel className="edit-navigation-menu-editor__panel">
			<PanelBody title={ __( 'Menu locations' ) }>
				<form
					onSubmit={ ( e ) => {
						e.preventDefault();
						saveLocations();
					} }
				>
					<table>
						<thead>
							<tr>
								<th scope="col">{ __( 'Theme Location' ) }</th>
								<th scope="col">{ __( 'Assigned Menu' ) }</th>
							</tr>
						</thead>
						<tbody>
							{ menuLocations.map( ( menuLocation ) => (
								<tr key={ menuLocation.name }>
									<td>{ menuLocation.description }</td>
									<td>
										<MenuSelectControl
											menus={ menus }
											menusList={ menusList }
											location={ menuLocation }
											onChange={ setLocations }
										/>
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
					<Button type="submit" isPrimary>
						{ __( 'Save' ) }
					</Button>
				</form>
			</PanelBody>
		</Panel>
	);
}
