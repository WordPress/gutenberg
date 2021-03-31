/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { merge, cloneDeep, flow } from 'lodash';
/**
 * Internal dependencies
 */
import { useMenuEntity, useSelectedMenuData } from './index';

const locationsForMenuId = ( menuLocationsByName, id ) =>
	Object.values( menuLocationsByName )
		.filter( ( { menu } ) => menu === id )
		.map( ( { name } ) => name );

export default function useMenuLocations() {
	const [ menuLocationsByName, setMenuLocationsByName ] = useState( null );
	const [ savedMenuLocationsByName, setSavedMenuLocationsByName ] = useState(
		null
	);
	const takeLocationsSnapshot = flow( [
		cloneDeep,
		setSavedMenuLocationsByName,
	] );

	const { menuId } = useSelectedMenuData();
	const { editMenuEntityRecord, menuEntityData, savedMenu } = useMenuEntity(
		menuId
	);

	useEffect( () => {
		takeLocationsSnapshot( menuLocationsByName );
	}, [ savedMenu ] );

	useEffect( () => {
		let isMounted = true;

		const fetchMenuLocationsByName = async () => {
			const newMenuLocationsByName = await apiFetch( {
				method: 'GET',
				path: '/__experimental/menu-locations/',
			} );

			if ( isMounted ) {
				setMenuLocationsByName( newMenuLocationsByName );
				takeLocationsSnapshot( newMenuLocationsByName );
				// flow( [ setMenuLocationsByName, takeLocationsSnapshot ] )(
				// 	newMenuLocationsByName
				// );
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
			const activeMenuId = oldMenuId || newMenuId;

			setMenuLocationsByName( newMenuLocationsByName );
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
	const savedMenuLocations = useMemo(
		() => Object.values( savedMenuLocationsByName || {} ),
		[ savedMenuLocationsByName ]
	);

	return {
		menuLocations,
		assignMenuToLocation,
		toggleMenuLocationAssignment,
		savedMenuLocations,
	};
}
