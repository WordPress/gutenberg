/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import { matchSorter } from 'match-sorter';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useDeferredValue } from '@wordpress/element';
import {
	BaseControl,
	Icon,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { check, search } from '@wordpress/icons';

export default function SearchWidget( { filter, view, onChangeView } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const deferredSearchValue = useDeferredValue( searchValue );
	const selectedFilter = view.filters.find(
		( _filter ) => _filter.field === filter.field
	);
	const selectedValues = selectedFilter?.value;
	const matches = useMemo( () => {
		return matchSorter( filter.elements, deferredSearchValue ?? '', {
			keys: [ 'label' ],
		} );
	}, [ filter.elements, deferredSearchValue ] );
	return (
		<Ariakit.ComboboxProvider
			value={ searchValue }
			setSelectedValue={ ( value ) => {
				const currentFilter = view.filters.find(
					( _filter ) => _filter.field === filter.field
				);
				const newFilters = currentFilter
					? [
							...view.filters.map( ( _filter ) => {
								if ( _filter.field === filter.field ) {
									return {
										..._filter,
										operator:
											currentFilter.operator ||
											filter.operators[ 0 ],
										value,
									};
								}
								return _filter;
							} ),
					  ]
					: [
							...view.filters,
							{
								field: filter.field,
								operator: filter.operators[ 0 ],
								value,
							},
					  ];
				onChangeView( {
					...view,
					page: 1,
					filters: newFilters,
				} );
			} }
			setValue={ setSearchValue }
		>
			<BaseControl
				className="dataviews-search-widget-filter-combobox__wrapper"
				__nextHasNoMarginBottom
			>
				<div className="dataviews-search-widget-filter-combobox__input-wrapper">
					<Ariakit.Combobox
						autoSelect
						placeholder={ __( 'Search' ) }
						className="dataviews-search-widget-filter-combobox__input"
					/>
					<div className="dataviews-search-widget-filter-combobox__icon">
						<Icon icon={ search } />
					</div>
				</div>
			</BaseControl>
			<Ariakit.ComboboxList
				className="dataviews-search-widget-filter-combobox-list"
				alwaysVisible
			>
				<VStack spacing={ 0 }>
					{ matches.map( ( element ) => {
						return (
							<Ariakit.ComboboxItem
								key={ element.value }
								value={ element.value }
								className="dataviews-search-widget-filter-combobox-item"
								hideOnClick={ false }
								setValueOnClick={ false }
								focusOnHover
							>
								<span className="dataviews-search-widget-filter-combobox-item-check">
									{ selectedValues === element.value && (
										<Icon icon={ check } />
									) }
								</span>
								<span>
									<Ariakit.ComboboxItemValue
										className="dataviews-search-widget-filter-combobox-item-value"
										value={ element.label }
									/>
									{ !! element.description && (
										<span className="dataviews-search-widget-filter-combobox-item-description">
											{ element.description }
										</span>
									) }
								</span>
							</Ariakit.ComboboxItem>
						);
					} ) }
					{ ! matches.length && <p>{ __( 'No results found' ) }</p> }
				</VStack>
			</Ariakit.ComboboxList>
		</Ariakit.ComboboxProvider>
	);
}
