/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useAsyncList,
	useInstanceId,
	useResizeObserver,
} from '@wordpress/compose';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import ItemActions from './item-actions';
import SingleSelectionCheckbox from './single-selection-checkbox';

const {
	useCompositeStoreV2: useCompositeStore,
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	CompositeRowV2: CompositeRow,
} = unlock( componentsPrivateApis );

const GridContext = createContext( {} );

/**
 * Split flat array of cells into groups.
 *
 * @param {Array}   cells     Flat array of cells to split
 * @param {integer} chunkSize Size to split cells
 * @return {Array} Cells split by `chunkSize`
 */
function useChunkedCells( cells, chunkSize ) {
	return useMemo( () => {
		const chunks = [];

		if ( cells?.length && chunkSize ) {
			for ( let i = 0; i < cells.length; i += chunkSize ) {
				chunks.push( cells.slice( i, i + chunkSize ) );
			}
		}

		return chunks;
	}, [ cells, chunkSize ] );
}

/**
 * Hook to automatically convert flat list of child cells into rows,
 * determined by the number of columns that fit into the available space.
 *
 * @param {Array}      cells     Flat array of cells to use in rows
 * @param {ElementRef} targetRef Reference to determine column width
 * @return {JSXElement} Rendered rows
 */
function useRows( cells, targetRef ) {
	const [ columnCount, setColumnCount ] = useState( cells?.length || 1 );
	const [ resizeListener, { width: totalWidth } ] = useResizeObserver();
	const chunkedCells = useChunkedCells( cells, columnCount );

	const referenceCell =
		targetRef?.current?.querySelector( '[role="gridcell"]' ) || {};
	const { offsetWidth: columnWidth = totalWidth } = referenceCell;

	useEffect( () => {
		if ( columnWidth && totalWidth ) {
			setColumnCount(
				Math.max( 1, Math.floor( totalWidth / columnWidth ) )
			);
		}
	}, [ columnWidth, totalWidth ] );

	const rows = useMemo(
		() =>
			chunkedCells.map( ( row, index ) => (
				<CompositeRow
					className="dataviews-view-grid__row"
					role="row"
					key={ `row-${ index }` }
				>
					{ row }
				</CompositeRow>
			) ),

		[ chunkedCells ]
	);

	return useMemo(
		() => (
			<>
				{ rows }
				{ resizeListener }
			</>
		),
		[ resizeListener, rows ]
	);
}

/**
 * Create CSS selector for element. We avoid IDs and classes as
 * they can be unstable across renders.
 *
 * @param {string}         context Grid item identifier
 * @param {Element | null} element Node to get selector for
 * @return {string | undefined} Selector for element
 */
function getFocusSelector( context, element ) {
	if ( ! element || ! element.parentElement ) return undefined;
	if ( element.id && element.id === context ) return `#${ context }`;

	const parent = getFocusSelector( context, element.parentElement );
	const siblings = Array.from( element.parentElement.children );
	const index = siblings.indexOf( element ) + 1;

	return `${ parent } > ${ element.nodeName }:nth-child(${ index })`;
}

function Grid( props = {} ) {
	const gridRef = useRef( null );
	const store = useCompositeStore( {
		focusWrap: 'horizontal',
		rtl: isRTL(),
	} );
	const { id: preferredId, children: cells, ...gridProps } = props;
	const id = useInstanceId( Grid, 'view-grid', preferredId );
	const rows = useRows( cells, gridRef );
	const focusedNodeSelectorRef = useRef( null );
	const setFocusedNode = ( context, node ) => {
		focusedNodeSelectorRef.current = getFocusSelector( context, node );
	};
	const [ lastSelectedItem, setLastSelectedItem ] = useState( null );
	const context = {
		...store,
		setFocusedNode,
		lastSelectedItem,
		setLastSelectedItem: ( _id, selected = true ) => {
			setLastSelectedItem( { id: _id, selected } );
		},
	};

	useEffect( () => {
		if ( focusedNodeSelectorRef.current ) {
			const doc = gridRef.current?.ownerDocument;
			const node = doc.querySelector( focusedNodeSelectorRef.current );
			node?.focus();
		}
	}, [ rows ] );

	return (
		<Composite
			role="grid"
			{ ...gridProps }
			id={ id }
			store={ store }
			ref={ gridRef }
		>
			<GridContext.Provider value={ context }>
				{ rows }
			</GridContext.Provider>
		</Composite>
	);
}

function GridItem( {
	selection,
	data,
	onSelectionChange,
	getItemId,
	item,
	actions,
	mediaField,
	primaryField,
	visibleFields,
} ) {
	const {
		setActiveId,
		setFocusedNode,
		setLastSelectedItem,
		lastSelectedItem,
		item: getGridItem,
		getState: getGridState,
		useState: useGridState,
		move,
		next,
		previous,
		up,
		down,
	} = useContext( GridContext );
	const itemId = getItemId( item );
	const id = `grid-item-${ itemId }`;
	const isSelected = selection.includes( itemId );
	const { activeId } = useGridState();
	const isActive = activeId === id;
	const [ hasNoPointerEvents, setHasNoPointerEvents ] = useState( false );
	const [ isInteractive, setIsInteractive ] = useState( isActive );
	const itemRef = useRef( null );
	const primaryFieldRef = useRef( null );
	const itemActionsRef = useRef( null );

	const getItem = useCallback(
		( meta ) => ( { ...meta, itemId } ),
		[ itemId ]
	);

	const setSelectedState = useCallback(
		( ids, setAsSelected ) => {
			const selectedData = data.filter( ( _item ) => {
				const _itemId = getItemId?.( _item );
				return setAsSelected
					? ids.includes( _itemId ) || selection.includes( _itemId )
					: ! ids.includes( _itemId ) &&
							selection.includes( _itemId );
			} );
			onSelectionChange( selectedData );
			setLastSelectedItem( ids[ ids.length - 1 ], setAsSelected );
		},
		[ data, getItemId, onSelectionChange, selection, setLastSelectedItem ]
	);

	const toggleIsSelected = useCallback(
		( setAsSelected = ! isSelected ) =>
			setSelectedState( [ itemId ], setAsSelected ),
		[ isSelected, itemId, setSelectedState ]
	);

	const getRowItemIds = useCallback( () => {
		const { renderedItems } = getGridState();
		const { rowId } = renderedItems.find( ( { id: _id } ) => _id === id );
		const ids = renderedItems
			.filter(
				( { rowId: _rowId, disabled } ) =>
					_rowId === rowId && ! disabled
			)
			.map( ( { itemId: _itemId } ) => _itemId );
		return ids;
	}, [ getGridState, id ] );

	const getColumnItemIds = useCallback( () => {
		const { renderedItems } = getGridState();
		const [ index, rows ] = renderedItems.reduce(
			( [ _index, _rows ], _item ) => {
				const row = _rows[ _item.rowId ] || [];
				row.push( _item.disabled ? undefined : _item.itemId );
				_rows[ _item.rowId ] = row;
				return [ _item.id === id ? row.length - 1 : _index, _rows ];
			},
			[ -1, {} ]
		);
		return Object.values( rows ).map( ( row ) => row[ index ] );
	}, [ getGridState, id ] );

	const keyDownHandler = useCallback(
		( event ) => {
			if ( event.defaultPrevented ) return;

			const { target, currentTarget } = event;
			const { key, ctrlKey, metaKey, shiftKey } = event;

			const isChildEvent = target !== currentTarget;
			const rtl = isRTL();
			const movementMap = new Map( [
				[ 'ArrowUp', up ],
				[ 'ArrowDown', down ],
				[ 'ArrowLeft', rtl ? next : previous ],
				[ 'ArrowRight', rtl ? previous : next ],
			] );

			if ( movementMap.has( key ) ) {
				const nextId = movementMap.get( key )();
				if ( nextId ) {
					setIsInteractive( false );
					if ( isChildEvent ) {
						move( nextId );
					} else if ( shiftKey ) {
						// Select this and 'next' grid item
						const { itemId: nextItemId } = getGridItem( nextId );
						setSelectedState( [ itemId, nextItemId ], true );
					}
				}
				return;
			}

			if ( isChildEvent ) {
				if ( key === 'Escape' || key === 'F2' ) {
					// Focus grid item
					event.preventDefault();
					itemRef.current?.focus();
				}

				return;
			}

			if ( key === 'Enter' || key === 'F2' ) {
				// Focus/action child item
				event.preventDefault();
				const action = key === 'Enter' ? 'click' : 'focus';
				if ( isAppleOS() ? metaKey : ctrlKey ) {
					// Cmd/ctrl operates on actions menu
					itemActionsRef.current?.[ action ]();
				} else {
					// Everything else operates on primary field
					primaryFieldRef.current?.[ action ]();
				}
				return;
			}

			if (
				( key === 'a' || key === 'A' ) &&
				( isAppleOS() ? metaKey : ctrlKey )
			) {
				// Select all/none
				event.preventDefault();
				setSelectedState(
					data.map( ( _item ) => getItemId?.( _item ) ),
					! shiftKey
				);
				return;
			}

			if ( key === ' ' ) {
				event.preventDefault();
				if ( ctrlKey ) {
					// Select the entire column
					setSelectedState( getColumnItemIds(), true );
				} else if ( shiftKey ) {
					// Select the entire row
					setSelectedState( getRowItemIds(), true );
				} else {
					// Toggle selected state
					toggleIsSelected();
				}
			}
		},
		[
			data,
			down,
			getColumnItemIds,
			getGridItem,
			getItemId,
			getRowItemIds,
			itemId,
			move,
			next,
			previous,
			setSelectedState,
			toggleIsSelected,
			up,
		]
	);

	const mediaEventHandlers = {
		onClick: () => primaryFieldRef.current?.click(),
	};

	return (
		<CompositeItem
			ref={ itemRef }
			render={ <VStack /> }
			role="gridcell"
			spacing={ 0 }
			key={ itemId }
			id={ id }
			getItem={ getItem }
			aria-selected={ isSelected }
			aria-label={ primaryField?.getValue( { item } ) }
			className={ classnames( 'dataviews-view-grid__card', {
				'is-selected': isSelected,
				'has-no-pointer-events': hasNoPointerEvents,
			} ) }
			onFocus={ ( { target } ) => {
				setIsInteractive( true );
				setActiveId( id );
				setFocusedNode( id, target );
			} }
			onBlur={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					setIsInteractive( false );
				}
				setFocusedNode( id, null );
			} }
			onKeyDown={ keyDownHandler }
			onMouseEnter={ ( event ) => {
				setIsInteractive( true );
				setHasNoPointerEvents(
					isAppleOS() ? event.metaKey : event.ctrlKey
				);
			} }
			onMouseLeave={ () => {
				setIsInteractive( isActive );
				setHasNoPointerEvents( false );
			} }
			onMouseMove={ ( event ) =>
				setHasNoPointerEvents(
					isAppleOS() ? event.metaKey : event.ctrlKey
				)
			}
			onMouseDown={ ( event ) => {
				setActiveId( id );
				event.currentTarget.focus();
				const { ctrlKey, metaKey, shiftKey } = event;
				if ( isAppleOS() ? metaKey : ctrlKey ) {
					event.preventDefault();
					setHasNoPointerEvents( true );
					if (
						shiftKey &&
						lastSelectedItem?.id &&
						lastSelectedItem?.id !== itemId
					) {
						const { renderedItems } = getGridState();
						const lastSelectedIndex = renderedItems.findIndex(
							( { itemId: _itemId } ) =>
								_itemId === lastSelectedItem.id
						);
						const currentIndex = renderedItems.findIndex(
							( { itemId: _itemId } ) => _itemId === itemId
						);
						const startIndex = Math.min(
							lastSelectedIndex,
							currentIndex
						);
						const endIndex =
							Math.max( lastSelectedIndex, currentIndex ) + 1;
						const range = renderedItems
							.slice( startIndex, endIndex )
							.map( ( { itemId: _itemId } ) => _itemId );
						if ( currentIndex < lastSelectedIndex ) {
							range.reverse();
						}
						setSelectedState( range, lastSelectedItem.selected );
					} else {
						toggleIsSelected();
					}
				}
			} }
		>
			<div
				className="dataviews-view-grid__wrapper"
				inert={ isInteractive ? undefined : '' }
			>
				{
					// Re: mediaEventHandlers below
					// jsx-ally es-lint rules don't like it when
					// you put event handlers on visible elements
					// without roles, so this prevents complaints.
				 }
				<div
					className="dataviews-view-grid__media"
					{ ...mediaEventHandlers }
				>
					{ mediaField?.render( { item } ) }
				</div>
				<HStack
					justify="space-between"
					className="dataviews-view-grid__title-actions"
				>
					<HStack className="dataviews-view-grid__primary-field">
						{ primaryField?.render( { item }, primaryFieldRef ) }
					</HStack>
					<div style={ { order: -1 } }>
						<SingleSelectionCheckbox
							item={ item }
							selection={ selection }
							onSelectionChange={ onSelectionChange }
							getItemId={ getItemId }
							data={ data }
							primaryField={ primaryField }
						/>
					</div>
					<ItemActions
						item={ item }
						actions={ actions }
						isCompact
						ref={ itemActionsRef }
					/>
				</HStack>
				<VStack className="dataviews-view-grid__fields" spacing={ 3 }>
					{ visibleFields.map( ( field ) => {
						const renderedValue = field.render( {
							item,
						} );
						if ( ! renderedValue ) {
							return null;
						}
						return (
							<VStack
								className="dataviews-view-grid__field"
								key={ field.id }
								spacing={ 1 }
							>
								<Tooltip text={ field.header } placement="left">
									<div className="dataviews-view-grid__field-value">
										{ renderedValue }
									</div>
								</Tooltip>
							</VStack>
						);
					} ) }
				</VStack>
			</div>
		</CompositeItem>
	);
}

export default function ViewGrid( {
	data,
	fields,
	view,
	actions,
	getItemId,
	deferredRendering,
	selection,
	onSelectionChange,
} ) {
	const mediaField = fields.find(
		( field ) => field.id === view.layout.mediaField
	);
	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.mediaField, view.layout.primaryField ].includes(
				field.id
			)
	);
	const shownData = useAsyncList( data, { step: 3 } );
	const usedData = deferredRendering ? shownData : data;

	const { filters, page, perPage, search, sort } = view;
	const ids = useMemo(
		() => JSON.stringify( usedData.map( ( { id } ) => id ) ),
		[ usedData ]
	);
	const key = useMemo(
		() => JSON.stringify( { filters, page, perPage, search, sort, ids } ),
		[ filters, page, perPage, search, sort, ids ]
	);

	return (
		<Grid className="dataviews-view-grid" key={ key }>
			{ usedData.map( ( item ) => {
				return (
					<GridItem
						key={ getItemId( item ) }
						selection={ selection }
						data={ data }
						onSelectionChange={ onSelectionChange }
						getItemId={ getItemId }
						item={ item }
						actions={ actions }
						mediaField={ mediaField }
						primaryField={ primaryField }
						visibleFields={ visibleFields }
					/>
				);
			} ) }
		</Grid>
	);
}
