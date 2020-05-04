/**
 * External dependencies
 */
import { map, flatMap, forEach, filter, groupBy } from 'lodash';
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

	const fetchmenuLocations = async () => {
		const path = '/__experimental/menu-locations';
		const apiLocations = await apiFetch( {
			path,
			method: 'GET',
		} );
		return flatMap( apiLocations );
	};

	const initmenuLocations = async () => {
		const latestLocations = await fetchmenuLocations();
		setMenuLocations( latestLocations );
	};

	// we need to fecth the list of locations
	// because the menu location entity
	// caches their menu associations
	useEffect( () => {
		initmenuLocations();
	}, [] );

	// as soon as we have the menus we group
	// all locations by the menuId they are assigned to
	useEffect( () => {
		if ( menuLocations ) {
			const locationsByMenu = groupBy( menuLocations, 'menu' );
			forEach( locationsByMenu, ( location, menuId ) => {
				locationsByMenu[ menuId ] = map( location, 'name' );
			} );
			setMenuLocationMap( locationsByMenu );
		}
	}, [ menuLocations ] );

	const assignMenuToLocation = ( oldMenuId, { newLocation, newMenuId } ) => {
		const newMenuLocationMap = {
			...menuLocationMap,
			[ oldMenuId ]: filter(
				menuLocationMap[ oldMenuId ],
				( oldLocation ) => oldLocation !== newLocation
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
		// we need to fetch the locations again after
		// we've updated their menu associations
		await initmenuLocations();
	};

	const saveMenuLocations = ( event ) => {
		event.preventDefault();
		setMenuLocations( null );
		updateLocations();
	};

	return [ menuLocations, saveMenuLocations, assignMenuToLocation ];
}
