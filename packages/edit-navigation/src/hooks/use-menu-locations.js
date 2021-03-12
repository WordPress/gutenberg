/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

export default function useMenuLocations() {
	const [ menuLocationsByName, setMenuLocationsByName ] = useState( null );

	useEffect( () => {
		let isMounted = true;

		const fetchMenuLocationsByName = async () => {
			const newMenuLocationsByName = await apiFetch( {
				method: 'GET',
				path: '/__experimental/menu-locations',
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

			const newMenuLocationsByName = {
				...menuLocationsByName,
				[ locationName ]: {
					...menuLocationsByName[ locationName ],
					menu: newMenuId,
				},
			};

			setMenuLocationsByName( newMenuLocationsByName );

			const promises = [];

			if ( oldMenuId ) {
				promises.push(
					saveMenu( {
						id: oldMenuId,
						locations: Object.values( newMenuLocationsByName )
							.filter( ( { menu } ) => menu === oldMenuId )
							.map( ( { name } ) => name ),
					} )
				);
			}

			if ( newMenuId ) {
				promises.push(
					saveMenu( {
						id: newMenuId,
						locations: Object.values( newMenuLocationsByName )
							.filter( ( { menu } ) => menu === newMenuId )
							.map( ( { name } ) => name ),
					} )
				);
			}

			await Promise.all( promises );
		},
		[ menuLocationsByName ]
	);

	const menuLocations = useMemo(
		() =>
			menuLocationsByName ? Object.values( menuLocationsByName ) : null,
		[ menuLocationsByName ]
	);

	return [ menuLocations, assignMenuToLocation ];
}
