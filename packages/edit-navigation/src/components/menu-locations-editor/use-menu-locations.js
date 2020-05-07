/**
 * External dependencies
 */
import { map, mapValues, flatMap, without, groupBy } from 'lodash';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

export default function useMenuLocations() {
	const { saveMenu } = useDispatch( 'core' );
	const [ menuLocations, setMenuLocations ] = useState( null );

	// a local state which maps menus to locations
	// so that we can send one call per menu when
	// updating locations, otherwise, without this local state
	// we'd send one call per location
	const [ menuLocationMap, setMenuLocationMap ] = useState( {} );

	const initMenuLocations = async () => {
		const path = '/__experimental/menu-locations';
		const apiLocations = await apiFetch( {
			path,
			method: 'GET',
		} );
		setMenuLocations( flatMap( apiLocations ) );
	};

	// we need to fetch the list of locations
	// because the menu location entity
	// caches their menu associations
	useEffect( () => {
		initMenuLocations();
	}, [] );

	// as soon as we have the menus we group
	// all locations by the menuId they are assigned to
	useEffect( () => {
		if ( menuLocations ) {
			const locationsByMenu = mapValues(
				groupBy( menuLocations, 'menu' ),
				( locations ) => map( locations, 'name' )
			);
			setMenuLocationMap( locationsByMenu );
		}
	}, [ menuLocations ] );

	const assignMenuToLocation = ( newLocation, newMenuId ) => {
		const newMenuLocationMap = {
			...mapValues( menuLocationMap, ( locationNames ) =>
				without( locationNames, newLocation )
			),
			[ newMenuId ]: [
				...( menuLocationMap[ newMenuId ] || [] ),
				newLocation,
			],
		};
		setMenuLocationMap( newMenuLocationMap );
	};

	const updateLocations = async () => {
		for ( const menuId in menuLocationMap ) {
			// sometimes menuId is 0 for unassigned locations
			if ( menuId > 0 ) {
				await saveMenu( {
					id: menuId,
					locations: menuLocationMap[ menuId ],
				} );
			}
		}
	};

	const saveMenuLocations = () => {
		updateLocations();
	};

	return [ menuLocations, saveMenuLocations, assignMenuToLocation ];
}
