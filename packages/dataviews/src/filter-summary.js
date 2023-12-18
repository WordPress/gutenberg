/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
	Icon,
} from '@wordpress/components';
import { chevronDown, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { OPERATOR_IN, OPERATOR_NOT_IN } from './constants';
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuGroupV2Ariakit: DropdownMenuGroup,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
	DropdownMenuRadioItemV2Ariakit: DropdownMenuRadioItem,
	DropdownMenuSeparatorV2Ariakit: DropdownMenuSeparator,
	DropdownMenuItemLabelV2Ariakit: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const OPERATORS = {
	[ OPERATOR_IN ]: {
		key: 'in-filter',
		label: __( 'Is' ),
	},
	[ OPERATOR_NOT_IN ]: {
		key: 'not-in-filter',
		label: __( 'Is not' ),
	},
};

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
								prefix={
									isActive ? (
										<Icon icon={ check } />
									) : (
										<span
											className="dataviews__filters-custom-menu-radio-item-prefix"
											aria-hidden="true"
										></span>
									)
								}
								onClick={ () =>
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
								<DropdownMenuItemLabel>
									{ element.label }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						);
					} ) }
				</DropdownMenuGroup>
				{ filter.operators.length > 1 && (
					<DropdownMenu
						trigger={
							<DropdownMenuItem
								suffix={
									<span aria-hidden="true">
										{ OPERATORS[ activeOperator ]?.label }
									</span>
								}
							>
								<DropdownMenuItemLabel>
									{ __( 'Conditions' ) }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						}
					>
						{ Object.entries( OPERATORS ).map(
							( [ operator, { label, key } ] ) => (
								<DropdownMenuRadioItem
									key={ key }
									name={ `filter-summary-${ filter.name }-conditions` }
									value={ operator }
									checked={ activeOperator === operator }
									onChange={ () => {
										onChangeView( {
											...view,
											page: 1,
											filters: [
												...otherFilters,
												{
													field: filter.field,
													operator,
													value: filterInView?.value,
												},
											],
										} );
									} }
								>
									<DropdownMenuItemLabel>
										{ label }
									</DropdownMenuItemLabel>
								</DropdownMenuRadioItem>
							)
						) }
					</DropdownMenu>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
}
