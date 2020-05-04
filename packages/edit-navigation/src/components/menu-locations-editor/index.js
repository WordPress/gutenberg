/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button, Panel, PanelBody, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuSelectControl from './menu-select-control';
import useMenuLocations from './use-menu-locations';

export default function MenuLocationsEditor() {
	const availableMenus = useSelect( ( select ) =>
		select( 'core' ).getMenus()
	);

	const [
		availableLocations,
		saveMenuLocations,
		assignMenuToLocation,
	] = useMenuLocations();

	if ( ! availableMenus || ! availableLocations ) {
		return <Spinner />;
	}

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
			<form onSubmit={ saveMenuLocations } >
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
												assignMenuToLocation
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
