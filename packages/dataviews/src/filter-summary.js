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
import { OPERATOR_IN, OPERATOR_NOT_IN, LAYOUT_LIST } from './constants';
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
	if ( view.type === LAYOUT_LIST ) {
		return null;
	}

	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);

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
						return (
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
								onSelect={ () =>
									onChangeView( ( currentView ) => ( {
										...currentView,
										page: 1,
										filters: [
											...view.filters.filter(
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
									} ) )
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
										{ filterInView.operator === OPERATOR_IN
											? __( 'Is' )
											: __( 'Is not' ) }
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
							aria-checked={
								filterInView?.operator === OPERATOR_IN
							}
							prefix={
								filterInView?.operator === OPERATOR_IN && (
									<Icon icon={ check } />
								)
							}
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
											value: filterInView?.value,
										},
									],
								} ) )
							}
						>
							{ __( 'Is' ) }
						</DropdownMenuItem>
						<DropdownMenuItem
							key="not-in-filter"
							role="menuitemradio"
							aria-checked={
								filterInView?.operator === OPERATOR_NOT_IN
							}
							prefix={
								filterInView?.operator === OPERATOR_NOT_IN && (
									<Icon icon={ check } />
								)
							}
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
											operator: OPERATOR_NOT_IN,
											value: filterInView?.value,
										},
									],
								} ) )
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
