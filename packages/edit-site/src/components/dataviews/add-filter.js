/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	BaseControl,
	Icon,
} from '@wordpress/components';
import { chevronRightSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2,
	DropdownSubMenuV2,
	DropdownSubMenuTriggerV2,
	DropdownMenuItemV2,
} = unlock( componentsPrivateApis );

export default function AddFilter( { filters, onChangeView } ) {
	return (
		<BaseControl>
			<DropdownMenuV2
				label={ __( 'Add filter' ) }
				trigger={
					<Button variant="tertiary">{ __( '+ Add filter' ) }</Button>
				}
			>
				{ filters.map( ( filter ) => (
					<DropdownSubMenuV2
						key={ filter.field }
						trigger={
							<DropdownSubMenuTriggerV2
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ filter.name }
							</DropdownSubMenuTriggerV2>
						}
					>
						{ filter.elements.map( ( element ) => (
							<DropdownMenuItemV2
								key={ element.value }
								onSelect={ () => {
									onChangeView( ( currentView ) => ( {
										...currentView,
										// TODO: set filter as well
										visibleFilters:
											currentView.visibleFilters.includes(
												filter.field
											)
												? currentView.visibleFilters
												: [
														...currentView.visibleFilters,
														filter.field,
												  ],
										filters: [
											...currentView.filters,
											{
												field: filter.field,
												operator: 'in',
												value: element.value,
											},
										],
									} ) );
								} }
								role="menuitemcheckbox"
							>
								{ element.label }
							</DropdownMenuItemV2>
						) ) }
					</DropdownSubMenuV2>
				) ) }
			</DropdownMenuV2>
		</BaseControl>
	);
}
