/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	BaseControl,
	Icon,
} from '@wordpress/components';
import { check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2, DropdownMenuItemV2 } = unlock( componentsPrivateApis );

export default function AddFilter( { filters, view, onChangeView } ) {
	return (
		<BaseControl>
			<DropdownMenuV2
				label={ __( 'Add filter' ) }
				trigger={
					<Button variant="tertiary">{ __( '+ Add filter' ) }</Button>
				}
			>
				{ filters.map( ( filter ) => (
					<DropdownMenuItemV2
						key={ filter.field }
						prefix={
							view.visibleFilters.includes( filter.field ) && (
								<Icon icon={ check } />
							)
						}
						onSelect={ ( event ) => {
							event.preventDefault();
							onChangeView( ( currentView ) => ( {
								...currentView,
								visibleFilters:
									currentView.visibleFilters.includes(
										filter.field
									)
										? currentView.visibleFilters.filter(
												( field ) =>
													field !== filter.field
										  )
										: [
												...currentView.visibleFilters,
												filter.field,
										  ],
							} ) );
						} }
						role="menuitemcheckbox"
					>
						{ filter.name }
					</DropdownMenuItemV2>
				) ) }
			</DropdownMenuV2>
		</BaseControl>
	);
}
