/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { merge } from 'lodash';

const locationsForMenuId = ( menuLocationsByName, id ) =>
	Object.values( menuLocationsByName )
		.filter( ( { menu } ) => menu === id )
		.map( ( { name } ) => name );

const withLocations = ( menuLocationsByName ) => ( id ) => ( {
	id,
	locations: locationsForMenuId( menuLocationsByName, id ),
} );

export default function useMenuLocations() {
	const [ menuLocationsByName, setMenuLocationsByName ] = useState( null );

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

	const { saveMenu } = useDispatch( 'core' );

	const assignMenuToLocation = useCallback(
		async ( locationName, newMenuId ) => {
			const oldMenuId = menuLocationsByName[ locationName ].menu;

			const newMenuLocationsByName = merge( menuLocationsByName, {
				[ locationName ]: { menu: newMenuId },
			} );

			setMenuLocationsByName( newMenuLocationsByName );

			[ oldMenuId, newMenuId ]
				.filter( Boolean )
				.map( withLocations( newMenuLocationsByName ) )
				.forEach( saveMenu );
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
