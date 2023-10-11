/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Icon,
	Button,
} from '@wordpress/components';
import { chevronDown, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2, DropdownMenuItemV2 } = unlock( componentsPrivateApis );

export default function AddFilter( { dataView } ) {
	const filterableFields = dataView
		.getAllColumns()
		.filter( ( column ) => column.getCanFilter() );
	if ( ! filterableFields.length ) {
		return null;
	}

	return (
		<DropdownMenuV2
			trigger={
				<Button variant="tertiary">
					{ __( 'Filters' ) }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			{ filterableFields.map( ( field ) => {
				return (
					<DropdownMenuItemV2
						key={ field.id }
						prefix={ <Icon icon={ check } /> }
						role="menuitemcheckbox"
						onSelect={ () => {} }
					>
						{ field.columnDef.header }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownMenuV2>
	);
}
