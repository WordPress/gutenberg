/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import removeAccents from 'remove-accents';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId, useDebouncedInput } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import {
	useState,
	useMemo,
	useCallback,
	useRef,
	useEffect,
	memo,
} from '@wordpress/element';
import {
	VisuallyHidden,
	Icon,
	Composite,
	Spinner,
} from '@wordpress/components';
import { check, search } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps, Option } from '../../types';
import useElements from '../../hooks/use-elements';

const LISTBOX_THRESHOLD = 10;
const EMPTY_ARRAY: [] = [];

// Stable query object for ListBox to prevent useElements from re-fetching on every render.
const LISTBOX_QUERY = { perPage: -1 };

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

function NoResultsFound() {
	return (
		<div className="dataform-controls__search-widget-no-results">
			{ __( 'No elements found' ) }
		</div>
	);
}

const MultiSelectionOption = ( { selected }: { selected: boolean } ) => {
	return (
		<span
			className={ clsx(
				'dataform-controls__search-widget-listitem-multi-selection',
				{ 'is-selected': selected }
			) }
		>
			{ selected && <Icon icon={ check } /> }
		</span>
	);
};

const SingleSelectionOption = ( { selected }: { selected: boolean } ) => {
	return (
		<span
			className={ clsx(
				'dataform-controls__search-widget-listitem-single-selection',
				{ 'is-selected': selected }
			) }
		/>
	);
};

const MemoizedComboboxItem = memo( function ComboboxItemComponent( {
	element,
	isMultiple,
	isSelected,
}: {
	element: Option;
	isMultiple: boolean;
	isSelected: boolean;
} ) {
	return (
		<Ariakit.ComboboxItem
			resetValueOnSelect={ false }
			value={ String( element.value ) }
			className="dataform-controls__search-widget-listitem"
			hideOnClick={ false }
			setValueOnClick={ false }
			focusOnHover
		>
			{ ! isMultiple && (
				<SingleSelectionOption selected={ isSelected } />
			) }
			{ isMultiple && <MultiSelectionOption selected={ isSelected } /> }
			<span>
				<Ariakit.ComboboxItemValue
					className="dataform-controls__search-widget-combobox-item-value"
					value={ element.label }
				/>
				{ !! element.description && (
					<span className="dataform-controls__search-widget-listitem-description">
						{ element.description }
					</span>
				) }
			</span>
		</Ariakit.ComboboxItem>
	);
} );

function generateCompositeItemId( prefix: string, value: string ) {
	return `${ prefix }-${ value }`;
}

interface ListBoxProps< Item > extends DataFormControlProps< Item > {
	defaultActiveId?: string | null;
}

function ListBox< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	defaultActiveId,
}: ListBoxProps< Item > ) {
	const baseId = useInstanceId( ListBox, 'dataform-search-widget-listbox' );
	const { type, label, getValue, setValue } = field;

	const isMultiple = type === 'array';
	const currentValue = useMemo( () => {
		const value = getValue( { item: data } );
		if ( value !== null && value !== undefined ) {
			return value;
		}
		return isMultiple ? EMPTY_ARRAY : '';
	}, [ getValue, data, isMultiple ] );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
		query: LISTBOX_QUERY,
	} );

	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>( defaultActiveId );

	const isSelected = useCallback(
		( value: string ) => {
			if ( isMultiple ) {
				return (
					Array.isArray( currentValue ) &&
					currentValue.some( ( v ) => String( v ) === value )
				);
			}
			return String( currentValue ) === value;
		},
		[ isMultiple, currentValue ]
	);

	const onSelect = useCallback(
		( value: string ) => {
			let newValue;
			if ( isMultiple ) {
				const current = Array.isArray( currentValue )
					? currentValue
					: [];
				if ( current.some( ( v ) => String( v ) === value ) ) {
					newValue = current.filter( ( v ) => String( v ) !== value );
				} else {
					newValue = [ ...current, value ];
				}
			} else {
				newValue = value;
			}
			onChange( setValue( { item: data, value: newValue } ) );
		},
		[ isMultiple, currentValue, data, onChange, setValue ]
	);

	if ( isLoading ) {
		return (
			<div className="dataform-controls__search-widget-is-loading">
				<Spinner />
			</div>
		);
	}

	if ( elements.length === 0 ) {
		return <NoResultsFound />;
	}

	return (
		<>
			{ ! hideLabelFromVision && (
				<div className="dataform-controls__search-widget-label">
					{ label }
				</div>
			) }
			<Composite
				virtualFocus
				focusLoop
				activeId={ activeCompositeId }
				setActiveId={ setActiveCompositeId }
				role="listbox"
				className="dataform-controls__search-widget-listbox"
				aria-label={ sprintf(
					/* translators: List of items for a field. 1: Field label. e.g.: "List of: Author". */
					__( 'List of: %1$s' ),
					label
				) }
				onFocusVisible={ () => {
					if ( ! activeCompositeId && elements.length ) {
						setActiveCompositeId(
							generateCompositeItemId(
								baseId as string,
								String( elements[ 0 ].value )
							)
						);
					}
				} }
				render={ <Composite.Typeahead /> }
			>
				{ elements.map( ( element ) => (
					<Composite.Hover
						key={ element.value }
						// @ts-expect-error focusOnHover is an Ariakit prop passed through but not typed in WP
						focusOnHover={ false }
						render={
							<Composite.Item
								id={ generateCompositeItemId(
									baseId as string,
									String( element.value )
								) }
								render={
									<div
										aria-label={ element.label }
										role="option"
										className="dataform-controls__search-widget-listitem"
									/>
								}
								onClick={ () =>
									onSelect( String( element.value ) )
								}
							/>
						}
					>
						{ ! isMultiple && (
							<SingleSelectionOption
								selected={ isSelected(
									String( element.value )
								) }
							/>
						) }
						{ isMultiple && (
							<MultiSelectionOption
								selected={ isSelected(
									String( element.value )
								) }
							/>
						) }
						<span>{ element.label }</span>
					</Composite.Hover>
				) ) }
			</Composite>
		</>
	);
}

function SearchWidgetCombobox< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { type, label, getValue, setValue } = field;

	const isMultiple = type === 'array';
	const currentValue = useMemo( () => {
		const value = getValue( { item: data } );
		if ( value !== null && value !== undefined ) {
			return value;
		}
		return isMultiple ? EMPTY_ARRAY : '';
	}, [ getValue, data, isMultiple ] );

	// Convert currentValue to string(s) for Ariakit (which expects string values).
	const selectedValueForAriakit = useMemo( () => {
		if ( isMultiple ) {
			return Array.isArray( currentValue )
				? currentValue.map( String )
				: [];
		}
		return currentValue !== null &&
			currentValue !== undefined &&
			currentValue !== ''
			? String( currentValue )
			: '';
	}, [ currentValue, isMultiple ] );

	const [ searchValue, setSearchValue, debouncedSearchValue ] =
		useDebouncedInput( '' );

	// Pagination state for infinite scroll.
	const [ page, setPage ] = useState( 1 );
	const [ accumulatedElements, setAccumulatedElements ] = useState<
		Option[]
	>( [] );
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );
	const observerRef = useRef< IntersectionObserver | null >( null );
	const loadMoreTriggerRef = useRef< HTMLDivElement | null >( null );

	const query = useMemo(
		() => ( {
			search: normalizeSearchInput( debouncedSearchValue ),
			page,
		} ),
		[ debouncedSearchValue, page ]
	);

	const { elements, isLoading, paginationInfo } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
		query,
	} );

	// Reset page when search changes.
	const prevSearchRef = useRef( debouncedSearchValue );
	useEffect( () => {
		if ( prevSearchRef.current !== debouncedSearchValue ) {
			setPage( 1 );
			prevSearchRef.current = debouncedSearchValue;
		}
	}, [ debouncedSearchValue ] );

	// Accumulate elements when new data arrives.
	useEffect( () => {
		if ( ! field.getElements ) {
			setAccumulatedElements( elements );
			return;
		}
		if ( isLoading ) {
			return;
		}

		if ( page === 1 ) {
			setAccumulatedElements( elements );
		} else {
			setAccumulatedElements( ( prev ) => {
				const existingValues = new Set(
					prev.map( ( el ) => el.value )
				);
				const newElements = elements.filter(
					( el ) => ! existingValues.has( el.value )
				);
				return [ ...prev, ...newElements ];
			} );
		}
		setIsLoadingMore( false );
	}, [ elements, page, isLoading, field.getElements ] );

	const hasMore = paginationInfo.totalPages > page;

	const loadMore = useCallback( () => {
		if ( ! hasMore || isLoading || isLoadingMore ) {
			return;
		}
		setIsLoadingMore( true );
		setPage( ( p ) => p + 1 );
	}, [ hasMore, isLoading, isLoadingMore ] );

	// Setup IntersectionObserver for infinite scroll.
	useEffect( () => {
		if ( ! field.getElements || ! hasMore ) {
			observerRef.current?.disconnect();
			return;
		}

		observerRef.current = new IntersectionObserver( ( entries ) => {
			if ( entries[ 0 ].isIntersecting ) {
				loadMore();
			}
		} );

		if ( loadMoreTriggerRef.current ) {
			observerRef.current.observe( loadMoreTriggerRef.current );
		}

		return () => observerRef.current?.disconnect();
	}, [ field.getElements, hasMore, loadMore ] );

	// Use accumulated elements when using getElements, otherwise use elements directly.
	const displayElements = field.getElements ? accumulatedElements : elements;

	// Filter matches based on search. If `getElements` exists,
	// elements are already filtered server-side.
	const matches = useMemo( () => {
		const normalizedSearchTerm =
			normalizeSearchInput( debouncedSearchValue );
		if ( ! normalizedSearchTerm || field.getElements ) {
			return displayElements;
		}
		return displayElements.filter( ( item ) =>
			normalizeSearchInput( item.label ).includes( normalizedSearchTerm )
		);
	}, [ displayElements, field.getElements, debouncedSearchValue ] );

	const onChangeValue = useCallback(
		( newValue: string | string[] ) => {
			// For single selection, Ariakit may pass an array - extract single value.
			const valueToSet =
				! isMultiple && Array.isArray( newValue )
					? newValue[ 0 ]
					: newValue;
			onChange( setValue( { item: data, value: valueToSet } ) );
		},
		[ data, onChange, setValue, isMultiple ]
	);

	const isSelected = useCallback(
		( value: string ) => {
			if ( isMultiple ) {
				return (
					Array.isArray( currentValue ) &&
					currentValue.some( ( v ) => String( v ) === value )
				);
			}
			return String( currentValue ) === value;
		},
		[ isMultiple, currentValue ]
	);

	return (
		<Ariakit.ComboboxProvider
			selectedValue={ selectedValueForAriakit }
			setSelectedValue={ onChangeValue }
			setValue={ setSearchValue }
		>
			<div className="dataform-controls__search-widget-combobox-wrapper">
				<Ariakit.ComboboxLabel
					render={
						hideLabelFromVision ? (
							<VisuallyHidden>{ label }</VisuallyHidden>
						) : (
							<span>{ label }</span>
						)
					}
				>
					{ label }
				</Ariakit.ComboboxLabel>
				<Ariakit.Combobox
					autoSelect="always"
					placeholder={ __( 'Search' ) }
					className="dataform-controls__search-widget-combobox-input"
					value={ searchValue }
				/>
				<div className="dataform-controls__search-widget-combobox-icon">
					<Icon icon={ search } />
				</div>
			</div>
			<Ariakit.ComboboxList
				className="dataform-controls__search-widget-combobox-list"
				alwaysVisible
			>
				{ isLoading && (
					<div className="dataform-controls__search-widget-is-loading">
						<Spinner />
					</div>
				) }
				{ ! isLoading && matches.length === 0 && <NoResultsFound /> }
				{ ! isLoading &&
					!! matches.length &&
					matches.map( ( element ) => (
						<MemoizedComboboxItem
							key={ element.value }
							element={ element }
							isMultiple={ isMultiple }
							isSelected={ isSelected( String( element.value ) ) }
						/>
					) ) }
				{ field.getElements && hasMore && (
					<div
						ref={ loadMoreTriggerRef }
						className="dataform-controls__search-widget-load-more-trigger"
						aria-hidden="true"
					/>
				) }
				{ isLoadingMore && (
					<div className="dataform-controls__search-widget-is-loading-more">
						<Spinner />
					</div>
				) }
			</Ariakit.ComboboxList>
		</Ariakit.ComboboxProvider>
	);
}

interface SearchWidgetProps< Item > extends DataFormControlProps< Item > {
	defaultActiveId?: string | null;
}

/**
 * SearchWidget control that routes between ListBox and SearchWidgetCombobox
 * based on the total number of elements.
 * @param props
 */
export default function SearchWidget< Item >(
	props: SearchWidgetProps< Item >
) {
	const { field } = props;
	const { getTotalAvailableElementsCount } = field;

	// Compute initial value synchronously.
	// For async fields, default to Combobox (no loader).
	const [ totalElements, setTotalElements ] = useState< number | null >(
		() => {
			// Async fields default to Combobox, may switch to ListBox after fetch.
			if ( field.getElements ) {
				return null;
			}
			// Static elements: use the actual count.
			if ( field.elements ) {
				return field.elements.length;
			}
			return 0;
		}
	);

	useEffect( () => {
		if ( ! getTotalAvailableElementsCount ) {
			return;
		}
		getTotalAvailableElementsCount().then( ( total ) => {
			if ( typeof total === 'number' ) {
				setTotalElements( total );
			}
		} );
	}, [ getTotalAvailableElementsCount ] );

	// Route to appropriate sub-component.
	// null or > threshold = Combobox, otherwise ListBox.
	if ( totalElements !== null && totalElements <= LISTBOX_THRESHOLD ) {
		return <ListBox { ...props } />;
	}

	return <SearchWidgetCombobox { ...props } />;
}
