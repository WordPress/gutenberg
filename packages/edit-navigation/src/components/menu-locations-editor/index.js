/**
 * WordPress dependencies
 */
import {
	SelectControl,
	Button,
	Panel,
	PanelBody,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useMenuLocations from './use-menu-locations';

export default function MenuLocationsEditor( { menus } ) {
	const [
		menuLocations,
		saveMenuLocations,
		assignMenuToLocation,
	] = useMenuLocations();

	if ( ! menus || ! menuLocations ) {
		return <Spinner />;
	}

	const menuSelectControlOptions = [
		{ value: 0, label: __( '— Select a Menu —' ) },
		...menus.map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) ),
	];

	if ( menuLocations.length === 0 ) {
		return (
			<Panel className="edit-navigation-menu-editor__panel">
				<PanelBody title={ __( 'Menu locations' ) }>
					<p>{ __( 'There are no available menu locations' ) }</p>
				</PanelBody>
			</Panel>
		);
	}

	if ( menus.length === 0 ) {
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
						saveMenuLocations();
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
							{ menuLocations.map( ( location ) => (
								<tr key={ location.name }>
									<td>{ location.description }</td>
									<td>
										<SelectControl
											options={ menuSelectControlOptions }
											value={ location.menu }
											onChange={ ( newMenuId ) => {
												assignMenuToLocation(
													location.name,
													parseInt( newMenuId )
												);
											} }
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
