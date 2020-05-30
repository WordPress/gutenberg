/**
 * External dependencies
 */
import {
	includes,
	map,
	find,
	findKey,
	mapValues,
	flatMap,
	groupBy,
} from 'lodash';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function useMenuLocations() {
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const { saveMenu } = useDispatch( 'core' );
	const [ menuLocations, setMenuLocations ] = useState( null );
	const [ emptyLocations, setEmptyLocations ] = useState( [] );

	// a local state which maps menus to locations
	// so that we can send one call per menu when
	// updating locations, otherwise, without this local state
	// we'd send one call per location
	const [ menuLocationMap, setMenuLocationMap ] = useState( null );

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
		newMenuId = parseInt( newMenuId );

		// we need the old menu ID so that we can set empty locations
		const oldMenuId = findKey( menuLocationMap, ( locations ) => {
			return includes( locations, newLocation );
		} );

		// we save a list on menus that were unassigned from their location
		// and the location is now empty because we need to send
		// an update to the API for these menus with an empty location set
		const newEmptyLocations = [ ...emptyLocations ];
		if ( newMenuId === 0 ) {
			if ( ! includes( newEmptyLocations, oldMenuId ) ) {
				newEmptyLocations.push( oldMenuId );
			}
		} else if ( includes( newEmptyLocations, oldMenuId ) ) {
			// if the menu is assigned to another location
			// we remove it from this list because the API
			// will unassign it from the past location
			delete newEmptyLocations[ oldMenuId ];
		}
		setEmptyLocations( newEmptyLocations );

		const updatedLocation = {
			...find( menuLocations, { name: newLocation } ),
		};
		updatedLocation.menu = newMenuId;

		const updatedLocationKey = findKey( menuLocations, {
			name: newLocation,
		} );

		const newMenuLocations = [ ...menuLocations ];
		newMenuLocations[ updatedLocationKey ] = { ...updatedLocation };

		setMenuLocations( newMenuLocations );
	};

	const saveMenuLocations = async () => {
		// first call the API to empty the locations of unset menus
		for ( const menuId of emptyLocations ) {
			await saveMenu( {
				id: menuId,
				locations: [],
			} );
		}

		// then save the new ones
		for ( const menuId in menuLocationMap ) {
			// sometimes menuId is 0 for unassigned locations
			if ( menuId > 0 ) {
				await saveMenu( {
					id: menuId,
					locations: menuLocationMap[ menuId ],
				} );
			}
		}
		createSuccessNotice( __( 'Menu locations saved.' ), {
			type: 'snackbar',
		} );
	};

	return [ menuLocations, saveMenuLocations, assignMenuToLocation ];
}
