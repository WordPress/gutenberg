/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { merge } from 'lodash';
/**
 * Internal dependencies
 */
import { useMenuEntity, useSelectedMenuId } from './index';

const locationsForMenuId = ( menuLocationsByName, id ) =>
	Object.values( menuLocationsByName )
		.filter( ( { menu } ) => menu === id )
		.map( ( { name } ) => name );

export default function useMenuLocations() {
	const [ menuLocationsByName, setMenuLocationsByName ] = useState( null );

	const [ menuId ] = useSelectedMenuId();
	const { editMenuEntityRecord, menuEntityData } = useMenuEntity( menuId );
	useEffect( () => {
		let isMounted = true;

		const fetchMenuLocationsByName = async () => {
			const newMenuLocationsByName = await apiFetch( {
				method: 'GET',
				path: '/__experimental/menu-locations/',
			} );

			if ( isMounted ) {
				setMenuLocationsByName( newMenuLocationsByName );
			}
		};

		fetchMenuLocationsByName();
		return () => ( isMounted = false );
	}, [] );

	const assignMenuToLocation = useCallback(
		async ( locationName, newMenuId ) => {
			const oldMenuId = menuLocationsByName[ locationName ].menu;

			const newMenuLocationsByName = merge( menuLocationsByName, {
				[ locationName ]: { menu: newMenuId },
			} );

			setMenuLocationsByName( newMenuLocationsByName );

			const activeMenuId = newMenuId || oldMenuId;
			editMenuEntityRecord( ...menuEntityData, {
				locations: locationsForMenuId(
					newMenuLocationsByName,
					activeMenuId
				),
			} );
		},
		[ menuLocationsByName ]
	);

	const toggleMenuLocationAssignment = ( locationName, newMenuId ) => {
		const idToSet =
			menuLocationsByName[ locationName ].menu === newMenuId
				? 0
				: newMenuId;
		assignMenuToLocation( locationName, idToSet );
	};

	const menuLocations = useMemo(
		() => Object.values( menuLocationsByName || {} ),
		[ menuLocationsByName ]
	);

	return {
		menuLocations,
		assignMenuToLocation,
		toggleMenuLocationAssignment,
	};
}
