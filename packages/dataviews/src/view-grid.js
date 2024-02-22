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
	privateApis as componentsPrivateApis,
	Tooltip,
} from '@wordpress/components';
import {
	useAsyncList,
	useInstanceId,
	useResizeObserver,
} from '@wordpress/compose';
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
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

function Grid( { id, children, ...gridProps } ) {
	const baseId = useInstanceId( Grid, 'view-grid', id );
	const gridRef = useRef( null );
	const store = useCompositeStore( {
		focusWrap: 'horizontal',
		rtl: isRTL(),
	} );
	const context = useMemo(
		() => ( { ...store, baseId } ),
		[ store, baseId ]
	);

	return (
		<Composite
			id={ baseId }
			ref={ gridRef }
			role="grid"
			store={ store }
			{ ...gridProps }
		>
			<GridContext.Provider value={ context }>
				<GridRows baseId={ baseId } gridRef={ gridRef }>
					{ children }
				</GridRows>
			</GridContext.Provider>
		</Composite>
	);
}

function GridRows( { baseId, gridRef, children } ) {
	const [ columnCount, setColumnCount ] = useState( children?.length || 1 );
	const [ resizeListener, { width: totalWidth } ] = useResizeObserver();

	const referenceCell =
		gridRef?.current?.querySelector( '[role="gridcell"]' ) || {};
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
			Array.from(
				{ length: Math.ceil( children?.length / columnCount ) },
				( _, index ) =>
					children.slice(
						index * columnCount,
						( index + 1 ) * columnCount
					)
			),
		[ children, columnCount ]
	);

	return useMemo(
		() => (
			<>
				{ resizeListener }
				<div className="dataviews-view-grid__rows">
					{ rows.map( ( row, index ) => (
						<CompositeRow
							className="dataviews-view-grid__row"
							role="row"
							id={ `${ baseId }-row-${ index }` }
							key={ `${ baseId }-row-${ index }` }
						>
							{ row }
						</CompositeRow>
					) ) }
				</div>
			</>
		),
		[ baseId, resizeListener, rows ]
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
	const [ hasNoPointerEvents, setHasNoPointerEvents ] = useState( false );
	const itemRef = useRef( null );
	const { baseId, move, next, previous, up, down } =
		useContext( GridContext );
	const itemId = getItemId( item );
	const id = `${ baseId }-item-${ itemId }`;
	const isSelected = selection.includes( itemId );
	const rtl = isRTL();
	const movementMap = useMemo(
		() =>
			new Map( [
				[ 'ArrowUp', up ],
				[ 'ArrowDown', down ],
				[ 'ArrowLeft', rtl ? next : previous ],
				[ 'ArrowRight', rtl ? previous : next ],
			] ),
		[ down, next, previous, rtl, up ]
	);

	return (
		<CompositeItem
			ref={ itemRef }
			render={ <VStack /> }
			spacing={ 0 }
			key={ itemId }
			id={ id }
			role="gridcell"
			aria-label={ primaryField?.getValue( { item } ) }
			className={ classnames( 'dataviews-view-grid__card', {
				'is-selected': isSelected,
				'has-no-pointer-events': hasNoPointerEvents,
			} ) }
			onMouseDown={ ( event ) => {
				if ( event.defaultPrevented ) return;

				if ( isAppleOS() ? event.ctrlKey : event.metaKey ) {
					setHasNoPointerEvents( true );
					const setAsSelected = ! isSelected;
					const selectedData = data.filter( ( _item ) => {
						const _itemId = getItemId?.( _item );
						const currentlyIncluded = selection.includes( _itemId );
						return setAsSelected
							? itemId === _itemId || currentlyIncluded
							: itemId !== _itemId && currentlyIncluded;
					} );
					onSelectionChange( selectedData );
				}
			} }
			onKeyDown={ ( event ) => {
				if ( event.defaultPrevented ) return;

				const { target, currentTarget, key } = event;

				if ( target !== currentTarget ) {
					if ( movementMap.has( key ) ) {
						move( movementMap.get( key )() || id );
					} else if ( key === 'Escape' ) {
						move( id );
					}
				}
			} }
			onClick={ () => {
				if ( hasNoPointerEvents ) {
					setHasNoPointerEvents( false );
				}
			} }
		>
			<div className="dataviews-view-grid__media">
				{ mediaField?.render( { item } ) }
			</div>
			<HStack
				justify="space-between"
				className="dataviews-view-grid__title-actions"
			>
				<SingleSelectionCheckbox
					id={ id }
					item={ item }
					selection={ selection }
					onSelectionChange={ onSelectionChange }
					getItemId={ getItemId }
					data={ data }
					primaryField={ primaryField }
				/>
				<HStack className="dataviews-view-grid__primary-field">
					{ primaryField?.render( { item } ) }
				</HStack>
				<ItemActions item={ item } actions={ actions } isCompact />
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
		</CompositeItem>
	);
}

export default function ViewGrid( {
	data,
	fields,
	view,
	actions,
	isLoading,
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
	const hasData = !! usedData?.length;
	return (
		<>
			{ hasData && (
				<Grid className="dataviews-view-grid" aria-busy={ isLoading }>
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
			) }
			{ ! hasData && (
				<div
					className={ classnames( {
						'dataviews-loading': isLoading,
						'dataviews-no-results': ! isLoading,
					} ) }
				>
					<p>{ isLoading ? __( 'Loading…' ) : __( 'No results' ) }</p>
				</div>
			) }
		</>
	);
}
