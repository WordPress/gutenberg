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
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { OPERATOR_IN, OPERATOR_NOT_IN } from './constants';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem,
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
							<DropdownMenuCheckboxItem
								key={ element.value }
								value={ element.value }
								checked={
									activeElement?.value === element.value
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
				</DropdownMenuGroup>
				{ filter.operators.length > 1 && (
					<DropdownSubMenu
						trigger={
							<DropdownSubMenuTrigger>
								{ __( 'Settings' ) }
							</DropdownSubMenuTrigger>
						}
					>
						<DropdownMenuCheckboxItem
							key="in-filter"
							value={ OPERATOR_IN }
							checked={ filterInView?.operator === OPERATOR_IN }
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
							{ __( 'Show matches' ) }
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							key="not-in-filter"
							value={ OPERATOR_NOT_IN }
							checked={
								filterInView?.operator === OPERATOR_NOT_IN
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
							{ __( 'Hide matches' ) }
						</DropdownMenuCheckboxItem>
					</DropdownSubMenu>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
}
