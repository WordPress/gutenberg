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

export default function AddFilter( { dataView, filters, onChangeFilters } ) {
	const filterableFields = dataView
		.getAllColumns()
		.filter( ( column ) => column.columnDef.renderFilter );
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
						prefix={
							filters.hasOwnProperty( field.id ) && (
								<Icon icon={ check } />
							)
						}
						role="menuitemcheckbox"
						onSelect={ ( event ) => {
							event.preventDefault();
							onChangeFilters( ( currentView ) => {
								if ( filters.hasOwnProperty( field.id ) ) {
									delete currentView.filters[ field.id ];
									return { ...currentView };
								}

								return {
									...currentView,
									filters: {
										...currentView.filters,
										[ field.id ]: undefined,
									},
								};
							} );
						} }
					>
						{ field.columnDef.header }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownMenuV2>
	);
}
