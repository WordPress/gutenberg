/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Spinner, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useMenuLocations from '../../hooks/use-menu-locations';

export default function ManageLocations() {
	const menus = useSelect( ( select ) => select( 'core' ).getMenus(), [] );

	const [ menuLocations, assignMenuToLocation ] = useMenuLocations();

	if ( ! menus || ! menuLocations ) {
		return <Spinner />;
	}

	if ( ! menus.length ) {
		return <p>{ __( 'There are no available menus.' ) }</p>;
	}

	if ( ! menuLocations.length ) {
		return <p>{ __( 'There are no available menu locations.' ) }</p>;
	}

	return menuLocations.map( ( menuLocation ) => (
		<SelectControl
			key={ menuLocation.name }
			label={ menuLocation.description }
			labelPosition="top"
			value={ menuLocation.menu }
			options={ [
				{ value: 0, label: __( 'Select a Menu' ) },
				...menus.map( ( menu ) => ( {
					value: menu.id,
					label: menu.name,
				} ) ),
			] }
			onChange={ ( menuId ) => {
				assignMenuToLocation( menuLocation.name, Number( menuId ) );
			} }
		/>
	) );
}
