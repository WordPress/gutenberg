/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
	Icon,
} from '@wordpress/components';
import { chevronDown, chevronRightSmall, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { OPERATOR_IN, OPERATOR_NOT_IN } from './constants';
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownSubMenuV2: DropdownSubMenu,
	DropdownSubMenuTriggerV2: DropdownSubMenuTrigger,
} = unlock( componentsPrivateApis );

const FilterText = ( { activeElement, filterInView, filter } ) => {
	if ( activeElement === undefined ) {
		return filter.name;
	}

	if (
		activeElement !== undefined &&
		filterInView?.operator === OPERATOR_IN
	) {
		return sprintf(
			/* translators: 1: Filter name. 2: Filter value. e.g.: "Author is Admin". */
			__( '%1$s is %2$s' ),
			filter.name,
			activeElement.label
		);
	}

	if (
		activeElement !== undefined &&
		filterInView?.operator === OPERATOR_NOT_IN
	) {
		return sprintf(
			/* translators: 1: Filter name. 2: Filter value. e.g.: "Author is not Admin". */
			__( '%1$s is not %2$s' ),
			filter.name,
			activeElement.label
		);
	}

	return sprintf(
		/* translators: 1: Filter name e.g.: "Unknown status for Author". */
		__( 'Unknown status for %1$s' ),
		filter.name
	);
};

function WithSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

export default function FilterSummary( { filter, view, onChangeView } ) {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const otherFilters = view.filters.filter(
		( f ) => f.field !== filter.field
	);
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);
	const activeOperator = filterInView?.operator || filter.operators[ 0 ];

	return (
		<DropdownMenu
			key={ filter.field }
			trigger={
				<Button variant="tertiary" size="compact" label={ filter.name }>
					<FilterText
						activeElement={ activeElement }
						filterInView={ filterInView }
						filter={ filter }
					/>
					<Icon icon={ chevronDown } style={ { flexShrink: 0 } } />
				</Button>
			}
		>
			<WithSeparators>
				<DropdownMenuGroup>
					{ filter.elements.map( ( element ) => {
						const isActive = activeElement?.value === element.value;
						return (
							<DropdownMenuItem
								key={ element.value }
								role="menuitemradio"
								aria-checked={ isActive }
								prefix={ isActive && <Icon icon={ check } /> }
								onSelect={ () =>
									onChangeView( {
										...view,
										page: 1,
										filters: [
											...otherFilters,
											{
												field: filter.field,
												operator: activeOperator,
												value: isActive
													? undefined
													: element.value,
											},
										],
									} )
								}
							>
								{ element.label }
							</DropdownMenuItem>
						);
					} ) }
				</DropdownMenuGroup>
				{ filter.operators.length > 1 && (
					<DropdownSubMenu
						trigger={
							<DropdownSubMenuTrigger
								suffix={
									<>
										{ activeOperator === OPERATOR_IN &&
											__( 'Is' ) }
										{ activeOperator === OPERATOR_NOT_IN &&
											__( 'Is not' ) }
										<Icon icon={ chevronRightSmall } />{ ' ' }
									</>
								}
							>
								{ __( 'Conditions' ) }
							</DropdownSubMenuTrigger>
						}
					>
						<DropdownMenuItem
							key="in-filter"
							role="menuitemradio"
							aria-checked={ activeOperator === OPERATOR_IN }
							prefix={
								activeOperator === OPERATOR_IN && (
									<Icon icon={ check } />
								)
							}
							onSelect={ () =>
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...otherFilters,
										{
											field: filter.field,
											operator: OPERATOR_IN,
											value: filterInView?.value,
										},
									],
								} )
							}
						>
							{ __( 'Is' ) }
						</DropdownMenuItem>
						<DropdownMenuItem
							key="not-in-filter"
							role="menuitemradio"
							aria-checked={ activeOperator === OPERATOR_NOT_IN }
							prefix={
								activeOperator === OPERATOR_NOT_IN && (
									<Icon icon={ check } />
								)
							}
							onSelect={ () =>
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...otherFilters,
										{
											field: filter.field,
											operator: OPERATOR_NOT_IN,
											value: filterInView?.value,
										},
									],
								} )
							}
						>
							{ __( 'Is not' ) }
						</DropdownMenuItem>
					</DropdownSubMenu>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
}
