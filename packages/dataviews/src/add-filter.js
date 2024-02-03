/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

export default function AddFilter( { filters, view, onChangeView } ) {
	if ( filters.length === 0 ) {
		return null;
	}
	const inactiveFilters = filters.filter( ( filter ) => ! filter.isVisible );
	return (
		<DropdownMenu
			trigger={
				<Button
					__experimentalIsFocusable
					size="compact"
					icon={ plus }
					className="dataviews-filters-button"
					variant="secondary"
					disabled={ ! inactiveFilters.length }
				>
					{ __( 'Add filter' ) }
				</Button>
			}
			style={ {
				minWidth: '230px',
			} }
		>
			{ inactiveFilters.map( ( filter ) => {
				return (
					<DropdownMenuItem
						key={ filter.field }
						onClick={ () => {
							onChangeView( {
								...view,
								page: 1,
								filters: [
									...( view.filters || [] ),
									{
										field: filter.field,
										value: undefined,
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
