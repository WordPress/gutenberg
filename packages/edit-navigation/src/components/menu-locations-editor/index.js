/**
 * External dependencies
 */
import { map, flatMap, filter, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { Button, Panel, PanelBody, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuSelectControl from './menu-select-control';

export default function MenuLocationsEditor() {
	const { saveMenu } = useDispatch( 'core' );

	const [ availableLocations, setAvailableLocations ] = useState( null );

	// a local state which maps menus to locations
	// so that we can send one call per menu when
	// updating locations, otherwise, without this local state
	// we'd send one call per location
	const [ menuLocationMap, setMenuLocationMap ] = useState( {} );

	const availableMenus = useSelect( ( select ) =>
		select( 'core' ).getMenus()
	);

	const fetchAvailableLocations = async () => {
		const path = `/__experimental/menu-locations`;
		const apiLocations = await apiFetch( {
			path,
			method: 'GET',
		} );
		return flatMap( apiLocations, ( value ) => value );
	};

	const initAvailableLocations = async () => {
		const latestLocations = await fetchAvailableLocations();
		setAvailableLocations( latestLocations );
	};

	// we need to fecth the list of locations
	// because the menu location entity
	// caches their menu associations
	useEffect( () => {
		initAvailableLocations();
	}, [] );

	// as soon as we have the menus we group
	// all locations by the menuId they are assigned to
	useEffect( () => {
		if ( availableMenus && availableLocations ) {
			const locations = groupBy( availableLocations, 'menu' );
			map( locations, ( location, menuId ) => {
				locations[ menuId ] = map( location, 'name' );
			} );
			setMenuLocationMap( locations );
		}
	}, [ availableLocations ] );

	if ( ! availableMenus || ! availableLocations ) {
		return <Spinner />;
	}

	const updateMenuLocationMap = ( oldMenuId, { newLocation, newMenuId } ) => {
		const newMenuLocationMap = menuLocationMap;

		// we need to remove the newLocation from any menu
		// which is already assigned to it
		newMenuLocationMap[ oldMenuId ] = filter(
			menuLocationMap[ oldMenuId ],
			( oldLocation ) => {
				return oldLocation !== newLocation;
			}
		);

		if ( ! newMenuLocationMap[ newMenuId ] ) {
			newMenuLocationMap[ newMenuId ] = [];
		}

		newMenuLocationMap[ newMenuId ].push( newLocation );
		setMenuLocationMap( newMenuLocationMap );
	};

	const updateLocations = async () => {
		for ( const menuId in menuLocationMap ) {
			if ( menuLocationMap.hasOwnProperty( menuId ) ) {
				const intMenuId = parseInt( menuId );
				if ( intMenuId ) {
					await saveMenu( {
						id: intMenuId,
						locations: menuLocationMap[ menuId ],
					} );
				}
			}
		}
		// we need to fetch the locations again after
		// we've updated their menu associations
		await initAvailableLocations();
	};

	const menuSelectControlOptions = [
		{ value: 0, label: __( '— Select a Menu —' ) },
		...availableMenus.map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) ),
	];

	if ( availableLocations.length === 0 ) {
		return (
			<Panel className="edit-navigation-menu-editor__panel">
				<PanelBody title={ __( 'Menu locations' ) }>
					<p>{ __( 'There are no available menu locations' ) }</p>
				</PanelBody>
			</Panel>
		);
	}

	if ( availableMenus.length === 0 ) {
		return (
			<Panel className="edit-navigation-menu-editor__panel">
				<PanelBody title={ __( 'Menu locations' ) }>
					<p>{ __( 'There are no available menus' ) }</p>
				</PanelBody>
			</Panel>
		);
	}

	return (
		<Panel className="edit-navigation-menu-editor__panel">
			<PanelBody title={ __( 'Menu locations' ) }>
				<form
					onSubmit={ ( event ) => {
						event.preventDefault();
						setAvailableLocations( null );
						updateLocations();
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
							{ availableLocations.map( ( location ) => (
								<tr key={ location.name }>
									<td>{ location.description }</td>
									<td>
										<MenuSelectControl
											location={ location }
											availableMenuIds={
												menuSelectControlOptions
											}
											onSelectMenu={
												updateMenuLocationMap
											}
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
