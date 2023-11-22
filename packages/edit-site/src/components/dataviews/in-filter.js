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

export default ( { filter, view, onChangeView } ) => {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElementLabels = filter.elements
		.filter( ( element ) => filterInView?.value?.includes( element.value ) )
		.map( ( element ) => element.label );

	return (
		<DropdownMenu
			key={ filter.field }
			trigger={
				<Button variant="tertiary" size="compact" label={ filter.name }>
					{ activeElementLabels.length === 0 && filter.name }
					{ activeElementLabels.length === 1 &&
						sprintf(
							/* translators: 1: Filter name. 2: filter value. e.g.: "Author is Admin". */
							__( '%1$s is %2$s' ),
							filter.name,
							activeElementLabels[ 0 ]
						) }
					{ activeElementLabels.length > 1 &&
						sprintf(
							/* translators: 1: Filter name. 2: filter value. e.g.: "Author in Admin, Editor". */
							__( '%1$s in %2$s' ),
							filter.name,
							activeElementLabels.join( ',' )
						) }
					<Icon icon={ chevronDown } style={ { flexShrink: 0 } } />
				</Button>
			}
		>
			{ filter.elements.map( ( element ) => {
				return (
					<DropdownMenuCheckboxItem
						key={ element.value }
						value={ element.value }
						checked={ activeElementLabels.includes(
							element.label
						) }
						onSelect={ ( event ) => {
							event.preventDefault();
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
										value: filterInView.value.includes(
											element.value
										)
											? filterInView.value.filter(
													( value ) =>
														value !== element.value
											  )
											: [
													...filterInView.value,
													element.value,
											  ],
									},
								],
							} ) );
						} }
					>
						{ element.label }
					</DropdownMenuCheckboxItem>
				);
			} ) }
		</DropdownMenu>
	);
};
