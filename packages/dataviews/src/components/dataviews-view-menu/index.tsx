import type { ReactNode } from 'react';
import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Children, Fragment, useContext } from '@wordpress/element';
import { settings } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import {
	OPERATOR_IS,
	OPERATOR_IS_ANY,
	SORTING_DIRECTIONS,
	sortLabels,
} from '../../constants';
import type { NormalizedFilter } from '../../types';
import getSelectionOperator from '../../utils/get-selection-operator';
import setFieldFilter from '../../utils/set-field-filter';
import DataViewsContext from '../dataviews-context';
import { getMenuFilters, MAX_INLINE_OPTIONS } from './utils';

// Radio values that don't stand for one of the filter's options.
const ALL = 'all';
const NONE = 'none';
const getOptionValue = ( index: number ) => `option-${ index }`;

export interface ViewMenuProps {
	/**
	 * Ids of fields to leave out of the menu. Use it for a field that is
	 * already shown elsewhere, such as the one in `DataViews.FilterTabs`.
	 */
	excludeFields?: string[];

	/**
	 * Ids of single-choice fields that always filter by one value. Their group
	 * has no "All" item. The view is expected to start with a filter for each
	 * of them.
	 */
	requiredFields?: string[];

	/**
	 * Whether the menu offers sorting: the field to sort by and the order.
	 *
	 * @default false
	 */
	showSort?: boolean;

	/**
	 * The size of the settings button: `compact` to sit next to
	 * `DataViews.Search`, or `default` to sit next to a 40px control.
	 *
	 * @default 'compact'
	 */
	size?: 'compact' | 'default';

	/**
	 * Extra menu items, added at the end of the menu. For example, a
	 * `Menu.LinkItem` pointing to a help page.
	 */
	children?: ReactNode;
}

function FilterRadioGroup( {
	filter,
	isRequired,
	showLabel,
}: {
	filter: NormalizedFilter;
	isRequired: boolean;
	showLabel: boolean;
} ) {
	const { view, onChangeView } = useContext( DataViewsContext );
	const elements = filter.elements ?? [];
	const activeFilter = view.filters?.find(
		( { field } ) => field === filter.field
	);

	let value = isRequired ? NONE : ALL;
	if ( activeFilter && activeFilter.value !== undefined ) {
		const index =
			activeFilter.operator === OPERATOR_IS
				? elements.findIndex(
						( element ) => element.value === activeFilter.value
					)
				: -1;
		// A filter set elsewhere that the menu can't represent (another
		// operator, or a value that isn't in the list) leaves nothing checked.
		value = index === -1 ? NONE : getOptionValue( index );
	}

	return (
		<Menu.RadioGroup
			aria-label={ showLabel ? undefined : filter.name }
			value={ value }
			onValueChange={ ( nextValue: string ) => {
				const index = elements.findIndex(
					( _element, i ) => getOptionValue( i ) === nextValue
				);
				onChangeView(
					setFieldFilter(
						view,
						filter.field,
						index === -1
							? undefined
							: {
									operator: OPERATOR_IS,
									value: elements[ index ].value,
								}
					)
				);
			} }
		>
			{ showLabel && <Menu.GroupLabel>{ filter.name }</Menu.GroupLabel> }
			{ ! isRequired && (
				<Menu.RadioItem value={ ALL } closeOnClick>
					<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
				</Menu.RadioItem>
			) }
			{ elements.map( ( element, index ) => (
				<Menu.RadioItem
					key={ getOptionValue( index ) }
					value={ getOptionValue( index ) }
					closeOnClick
				>
					<Menu.ItemLabel>{ element.label }</Menu.ItemLabel>
				</Menu.RadioItem>
			) ) }
		</Menu.RadioGroup>
	);
}

function FilterCheckboxGroup( {
	filter,
	showLabel,
}: {
	filter: NormalizedFilter;
	showLabel: boolean;
} ) {
	const { view, onChangeView } = useContext( DataViewsContext );
	const elements = filter.elements ?? [];
	const activeFilter = view.filters?.find(
		( { field, operator } ) =>
			field === filter.field && operator === OPERATOR_IS_ANY
	);
	const activeValues: unknown[] = Array.isArray( activeFilter?.value )
		? activeFilter.value
		: [];

	return (
		<Menu.Group aria-label={ showLabel ? undefined : filter.name }>
			{ showLabel && <Menu.GroupLabel>{ filter.name }</Menu.GroupLabel> }
			{ elements.map( ( element, index ) => (
				<Menu.CheckboxItem
					key={ getOptionValue( index ) }
					checked={ activeValues.includes( element.value ) }
					onCheckedChange={ ( checked: boolean ) => {
						const nextValues = checked
							? [ ...activeValues, element.value ]
							: activeValues.filter(
									( value ) => value !== element.value
								);
						onChangeView(
							setFieldFilter(
								view,
								filter.field,
								// With nothing checked, the field isn't filtered.
								nextValues.length > 0
									? {
											operator: OPERATOR_IS_ANY,
											value: nextValues,
										}
									: undefined
							)
						);
					} }
				>
					<Menu.ItemLabel>{ element.label }</Menu.ItemLabel>
				</Menu.CheckboxItem>
			) ) }
		</Menu.Group>
	);
}

/**
 * The options of one filter, following the filter the field defines: radio
 * items when it takes one value, checkboxes when it takes several.
 */
function FilterOptions( {
	filter,
	isRequired,
	showLabel,
}: {
	filter: NormalizedFilter;
	isRequired: boolean;
	showLabel: boolean;
} ) {
	if ( getSelectionOperator( filter ) === OPERATOR_IS_ANY ) {
		return (
			<FilterCheckboxGroup filter={ filter } showLabel={ showLabel } />
		);
	}
	return (
		<FilterRadioGroup
			filter={ filter }
			isRequired={ isRequired }
			showLabel={ showLabel }
		/>
	);
}

function SortFieldRadioGroup() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	const sortableFields = fields.filter(
		( field ) => field.enableSorting !== false
	);
	return (
		<Menu.RadioGroup
			value={ view.sort?.field ?? NONE }
			onValueChange={ ( field: string ) => {
				onChangeView( {
					...view,
					sort: {
						direction: view.sort?.direction || 'desc',
						field,
					},
					showLevels: false,
				} );
			} }
		>
			<Menu.GroupLabel>{ __( 'Sort by' ) }</Menu.GroupLabel>
			{ sortableFields.map( ( field ) => (
				<Menu.RadioItem
					key={ field.id }
					value={ field.id }
					closeOnClick
				>
					<Menu.ItemLabel>{ field.label }</Menu.ItemLabel>
				</Menu.RadioItem>
			) ) }
		</Menu.RadioGroup>
	);
}

function SortDirectionRadioGroup() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	let value: string | undefined = view.sort?.direction;
	if ( ! value ) {
		value = view.sort?.field ? 'desc' : NONE;
	}
	return (
		<Menu.RadioGroup
			value={ value }
			onValueChange={ ( direction: string ) => {
				if ( direction !== 'asc' && direction !== 'desc' ) {
					return;
				}
				onChangeView( {
					...view,
					sort: {
						direction,
						field:
							view.sort?.field ||
							// Without a field to sort by yet, use the first sortable one.
							fields.find(
								( field ) => field.enableSorting !== false
							)?.id ||
							'',
					},
					showLevels: false,
				} );
			} }
		>
			<Menu.GroupLabel>{ __( 'Order' ) }</Menu.GroupLabel>
			{ SORTING_DIRECTIONS.map( ( direction ) => (
				<Menu.RadioItem
					key={ direction }
					value={ direction }
					closeOnClick
				>
					<Menu.ItemLabel>{ sortLabels[ direction ] }</Menu.ItemLabel>
				</Menu.RadioItem>
			) ) }
		</Menu.RadioGroup>
	);
}

/**
 * A single settings button, in place of the filters and the view options
 * buttons of the default UI. It opens a menu with the filters that have a
 * fixed list of choices, sorting and any extra items.
 *
 * It is meant for narrow, single-purpose panels, where the filters bar and the
 * view options popover don't fit. It builds itself from the fields and the
 * view, as the default UI does, and renders nothing when the menu would be
 * empty.
 */
export default function DataViewsViewMenu( {
	excludeFields,
	requiredFields = [],
	showSort = false,
	size = 'compact',
	children,
}: ViewMenuProps ) {
	const { fields, filters } = useContext( DataViewsContext );
	const menuFilters = getMenuFilters( filters, fields, excludeFields );
	const sortableFields = fields.filter(
		( field ) => field.enableSorting !== false
	);
	const hasSort = showSort && sortableFields.length > 0;
	const hasChildren = Children.toArray( children ).length > 0;

	if ( ! menuFilters.length && ! hasSort && ! hasChildren ) {
		return null;
	}

	const sections: { key: string; content: ReactNode }[] = [];

	// With many options in all, each group moves to a submenu.
	const optionCount =
		menuFilters.reduce(
			( count, filter ) => count + ( filter.elements?.length ?? 0 ),
			0
		) + ( hasSort ? sortableFields.length + SORTING_DIRECTIONS.length : 0 );

	if ( optionCount > MAX_INLINE_OPTIONS ) {
		sections.push( {
			key: 'submenus',
			content: (
				<>
					{ menuFilters.map( ( filter ) => (
						<Menu.SubmenuRoot key={ filter.field }>
							<Menu.SubmenuTrigger>
								<Menu.ItemLabel>{ filter.name }</Menu.ItemLabel>
							</Menu.SubmenuTrigger>
							<Menu.Popup>
								<FilterOptions
									filter={ filter }
									isRequired={ requiredFields.includes(
										filter.field
									) }
									showLabel={ false }
								/>
							</Menu.Popup>
						</Menu.SubmenuRoot>
					) ) }
					{ hasSort && (
						<Menu.SubmenuRoot>
							<Menu.SubmenuTrigger>
								<Menu.ItemLabel>
									{ __( 'Sort' ) }
								</Menu.ItemLabel>
							</Menu.SubmenuTrigger>
							<Menu.Popup>
								<SortFieldRadioGroup />
								<Menu.Separator />
								<SortDirectionRadioGroup />
							</Menu.Popup>
						</Menu.SubmenuRoot>
					) }
				</>
			),
		} );
	} else {
		menuFilters.forEach( ( filter ) => {
			sections.push( {
				key: `filter-${ filter.field }`,
				content: (
					<FilterOptions
						filter={ filter }
						isRequired={ requiredFields.includes( filter.field ) }
						showLabel
					/>
				),
			} );
		} );
		if ( hasSort ) {
			sections.push(
				{ key: 'sort-field', content: <SortFieldRadioGroup /> },
				{ key: 'sort-direction', content: <SortDirectionRadioGroup /> }
			);
		}
	}

	if ( hasChildren ) {
		sections.push( { key: 'extra', content: children } );
	}

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						className="dataviews-view-menu__toggle"
						__next40pxDefaultSize
						size={ size }
						icon={ settings }
						label={ _x( 'View options', 'View is used as a noun' ) }
					/>
				}
			/>
			<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
				{ sections.map( ( section, index ) => (
					<Fragment key={ section.key }>
						{ index > 0 && <Menu.Separator /> }
						{ section.content }
					</Fragment>
				) ) }
			</Menu.Popup>
		</Menu.Root>
	);
}
