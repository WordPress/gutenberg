import type { ReactNode } from 'react';
import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Children, Fragment, useContext } from '@wordpress/element';
import { settings } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { OPERATOR_IS, SORTING_DIRECTIONS, sortLabels } from '../../constants';
import type { NormalizedFilter } from '../../types';
import setFieldFilter from '../../utils/set-field-filter';
import DataViewsContext from '../dataviews-context';
import { getMenuFilters } from './utils';

/**
 * Above this number of filters, each one moves to its own submenu so the menu
 * stays short.
 */
const MAX_INLINE_FILTERS = 2;

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
	 * Ids of fields that always filter by one value. Their group has no "All"
	 * item. The view is expected to start with a filter for each of them.
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
	 * Extra menu items, added after "Reset view". For example, a
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
 * A settings button that opens a menu with the options of the view: filters
 * with a short list of choices, sorting, "Reset view" and any extra items.
 *
 * It is meant for narrow, single-purpose panels, where the filters bar and the
 * view options popover of the default UI don't fit. It builds itself from the
 * fields and the view, and renders nothing when the menu would be empty.
 */
export default function DataViewsViewMenu( {
	excludeFields,
	requiredFields = [],
	showSort = false,
	size = 'compact',
	children,
}: ViewMenuProps ) {
	const { fields, filters, onReset } = useContext( DataViewsContext );
	const menuFilters = getMenuFilters( filters, fields, excludeFields );
	const hasSort =
		showSort && fields.some( ( field ) => field.enableSorting !== false );
	const hasReset = onReset !== undefined;
	const hasChildren = Children.toArray( children ).length > 0;

	if ( ! menuFilters.length && ! hasSort && ! hasReset && ! hasChildren ) {
		return null;
	}

	const sections: { key: string; content: ReactNode }[] = [];

	if ( menuFilters.length > MAX_INLINE_FILTERS ) {
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
								<FilterRadioGroup
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
					<FilterRadioGroup
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

	if ( hasReset || hasChildren ) {
		sections.push( {
			key: 'actions',
			content: (
				<>
					{ hasReset && (
						<Menu.Item
							disabled={ onReset === false }
							onClick={ () => {
								if ( typeof onReset === 'function' ) {
									onReset();
								}
							} }
						>
							<Menu.ItemLabel>
								{ __( 'Reset view' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }
					{ children }
				</>
			),
		} );
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
