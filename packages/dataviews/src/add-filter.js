/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

function AddFilter( { filters, view, onChangeView, setOpenedFilter }, ref ) {
	if ( ! filters.length || filters.every( ( { isPrimary } ) => isPrimary ) ) {
		return null;
	}
	const inactiveFilters = filters.filter( ( filter ) => ! filter.isVisible );
	return (
		<DropdownMenu
			trigger={
				<Button
					__experimentalIsFocusable
					size="compact"
					className="dataviews-filters-button"
					variant="tertiary"
					disabled={ ! inactiveFilters.length }
					ref={ ref }
				>
					{ __( 'Add filter' ) }
				</Button>
			}
		>
			{ inactiveFilters.map( ( filter ) => {
				return (
					<DropdownMenuItem
						key={ filter.field }
						onClick={ () => {
							setOpenedFilter( filter.field );
							onChangeView( {
								...view,
								page: 1,
								filters: [
									...( view.filters || [] ),
									{
										field: filter.field,
										value: undefined,
										operator: filter.operators[ 0 ],
									},
								],
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ filter.name }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				);
			} ) }
		</DropdownMenu>
	);
}

export default forwardRef( AddFilter );
