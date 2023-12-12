/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Icon,
} from '@wordpress/components';
import { chevronRightSmall, funnel, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownSubMenuV2: DropdownSubMenu,
	DropdownSubMenuTriggerV2: DropdownSubMenuTrigger,
	DropdownMenuItemV2: DropdownMenuItem,
} = unlock( componentsPrivateApis );

export default function AddFilter( { filters, view, onChangeView } ) {
	if ( filters.length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			label={ __( 'Filters' ) }
			trigger={
				<Button
					__experimentalIsFocusable
					variant="tertiary"
					size="compact"
				>
					<Icon icon={ funnel } style={ { flexShrink: 0 } } />
				</Button>
			}
		>
			{ filters.map( ( filter ) => {
				const filterInView = view.filters.find(
					( f ) => f.field === filter.field
				);
				const activeElement = filter.elements.find(
					( element ) => element.value === filterInView?.value
				);
				return (
					<DropdownSubMenu
						key={ filter.field }
						trigger={
							<DropdownSubMenuTrigger
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ filter.name }
							</DropdownSubMenuTrigger>
						}
					>
						{ filter.elements.map( ( element ) => (
							<DropdownMenuItem
								key={ element.value }
								role="menuitemradio"
								aria-checked={
									activeElement?.value === element.value
								}
								prefix={
									activeElement?.value === element.value && (
										<Icon icon={ check } />
									)
								}
								onSelect={ () => {
									onChangeView( ( currentView ) => ( {
										...currentView,
										page: 1,
										filters: [
											...currentView.filters.filter(
												( f ) =>
													f.field !== filter.field
											),
											{
												field: filter.field,
												operator:
													filterInView?.operator ||
													filter.operators[ 0 ],
												value:
													activeElement?.value ===
													element.value
														? undefined
														: element.value,
											},
										],
									} ) );
								} }
							>
								{ element.label }
							</DropdownMenuItem>
						) ) }
					</DropdownSubMenu>
				);
			} ) }
		</DropdownMenu>
	);
}
