/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
	Icon,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OPERATOR_IN } from './constants';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem,
} = unlock( componentsPrivateApis );

export default function FilterSummary( { filter, view, onChangeView } ) {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);

	return (
		<DropdownMenu
			key={ filter.field }
			trigger={
				<Button variant="tertiary" size="compact" label={ filter.name }>
					{ activeElement !== undefined
						? sprintf(
								/* translators: 1: Filter name. 2: filter value. e.g.: "Author is Admin". */
								__( '%1$s is %2$s' ),
								filter.name,
								activeElement.label
						  )
						: filter.name }
					<Icon icon={ chevronDown } style={ { flexShrink: 0 } } />
				</Button>
			}
		>
			{ filter.elements.map( ( element ) => {
				return (
					<DropdownMenuCheckboxItem
						key={ element.value }
						value={ element.value }
						checked={ activeElement?.value === element.value }
						onSelect={ () =>
							onChangeView( ( currentView ) => ( {
								...currentView,
								page: 1,
								filters: [
									...view.filters.filter(
										( f ) => f.field !== filter.field
									),
									{
										field: filter.field,
										operator: OPERATOR_IN,
										value:
											activeElement?.value ===
											element.value
												? undefined
												: element.value,
									},
								],
							} ) )
						}
					>
						{ element.label }
					</DropdownMenuCheckboxItem>
				);
			} ) }
		</DropdownMenu>
	);
}
