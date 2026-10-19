import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data as allData, fields as fixtureFields } from './fixtures';

// This consumer supplies ancestor metadata; DataViews does not resolve ancestors.
const itemsById = new Map( allData.map( ( item ) => [ item.id, item ] ) );
const ancestorPathsById = new Map(
	allData.map( ( item ) => {
		const ancestorPath: string[] = [];
		let parent = itemsById.get( item.parent ?? -1 );
		while ( parent ) {
			ancestorPath.unshift( parent.name.title );
			parent = itemsById.get( parent.parent ?? -1 );
		}
		return [ item.id, ancestorPath ];
	} )
);
const fields: typeof fixtureFields = [
	...fixtureFields,
	{
		id: 'ancestorPath',
		label: __( 'Location' ),
		type: 'text',
		enableSorting: false,
		enableGlobalSearch: false,
		filterBy: false,
		getValue: ( { item } ) =>
			ancestorPathsById.get( item.id )?.join( ' / ' ) ?? '',
		render: ( { item } ) => {
			const ancestorPath = ancestorPathsById.get( item.id ) ?? [];
			return ancestorPath.length ? (
				<span role="group" aria-label={ __( 'Breadcrumbs' ) }>
					{ ancestorPath.join( ' / ' ) }
				</span>
			) : null;
		},
	},
];

const ROOT_KEY = 'root';
const ROOT_BATCH_SIZE = 1;
const CHILD_BATCH_SIZE = 4;

const getPaginationKey = ( parentId: string | null ) => parentId ?? ROOT_KEY;

const HierarchicalLevelsComponent = ( {
	showLevels = true,
}: {
	showLevels?: boolean;
} ) => {
	const [ expandedItemIds, setExpandedItemIds ] = useState< string[] >( [
		'38',
	] );
	const [ loadedCounts, setLoadedCounts ] = useState<
		Record< string, number >
	>( {
		[ ROOT_KEY ]: ROOT_BATCH_SIZE,
	} );
	const [ loadingKeys, setLoadingKeys ] = useState< Set< string > >(
		new Set()
	);
	const [ errors, setErrors ] = useState< Record< string, string > >( {} );
	const failedOnce = useRef< Set< string > >( new Set() );
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 50,
		layout: {},
		filters: [],
		fields: [ 'type', 'parent' ],
		sort: {
			field: 'title',
			direction: 'asc',
		},
		titleField: 'title',
		mediaField: 'image',
		showLevels,
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
		} ) );
	}, [ showLevels ] );

	const sortedData = useMemo(
		() =>
			filterSortAndPaginate(
				allData,
				{ ...view, page: 1, perPage: allData.length },
				fields
			).data,
		[ view ]
	);
	const childrenByParentId = useMemo( () => {
		const result = new Map< string, typeof allData >();
		const loadedItemIds = new Set( sortedData.map( ( item ) => item.id ) );
		for ( const item of sortedData ) {
			const key = getPaginationKey(
				item.parent !== null && loadedItemIds.has( item.parent )
					? item.parent.toString()
					: null
			);
			result.set( key, [ ...( result.get( key ) ?? [] ), item ] );
		}
		return result;
	}, [ sortedData ] );
	const getLoadedCount = useCallback(
		( parentId: string | null ) =>
			loadedCounts[ getPaginationKey( parentId ) ] ?? CHILD_BATCH_SIZE,
		[ loadedCounts ]
	);
	const loadedData = useMemo( () => {
		const result: typeof allData = [];
		const addChildren = ( parentId: string | null ) => {
			const children =
				childrenByParentId.get( getPaginationKey( parentId ) ) ?? [];
			for ( const item of children.slice(
				0,
				getLoadedCount( parentId )
			) ) {
				result.push( item );
				if ( expandedItemIds.includes( item.id.toString() ) ) {
					addChildren( item.id.toString() );
				}
			}
		};
		addChildren( null );
		return result;
	}, [ childrenByParentId, expandedItemIds, getLoadedCount ] );
	const parentIds = new Set(
		allData
			.map( ( item ) => item.parent )
			.filter( ( parent ) => parent !== null )
	);
	const onLoadMore = ( parentId: string | null ) => {
		const key = getPaginationKey( parentId );
		setLoadingKeys( ( current ) => new Set( current ).add( key ) );
		window.setTimeout( () => {
			// Demonstrate a deterministic error and retry for Jupiter's children.
			if ( parentId === '16' && ! failedOnce.current.has( key ) ) {
				failedOnce.current.add( key );
				setErrors( ( current ) => ( {
					...current,
					[ key ]: __( 'Children could not be loaded.' ),
				} ) );
			} else {
				setErrors( ( current ) => {
					const next = { ...current };
					delete next[ key ];
					return next;
				} );
				setLoadedCounts( ( current ) => ( {
					...current,
					[ key ]:
						( current[ key ] ??
							( parentId === null
								? ROOT_BATCH_SIZE
								: CHILD_BATCH_SIZE ) ) +
						( parentId === null
							? ROOT_BATCH_SIZE
							: CHILD_BATCH_SIZE ),
				} ) );
			}
			setLoadingKeys( ( current ) => {
				const next = new Set( current );
				next.delete( key );
				return next;
			} );
		}, 600 );
	};
	const isHierarchyEnabled = view.showLevels && ! view.search;
	const data = isHierarchyEnabled ? loadedData : sortedData;
	const displayedView = view.search
		? {
				...view,
				showLevels: false,
				descriptionField: 'ancestorPath',
				showDescription: true,
			}
		: { ...view, descriptionField: undefined };

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			getItemParentId={ ( item ) => item.parent }
			getItemHasChildren={ ( item ) => parentIds.has( item.id ) }
			expandedItemIds={ expandedItemIds }
			onChangeExpandedItemIds={ setExpandedItemIds }
			hierarchyPagination={ {
				getPaginationInfo: ( parentId ) => {
					const key = getPaginationKey( parentId );
					const totalItems =
						childrenByParentId.get( key )?.length ?? 0;
					return {
						hasMore: getLoadedCount( parentId ) < totalItems,
						remainingItems: Math.max(
							0,
							totalItems - getLoadedCount( parentId )
						),
						isLoading: loadingKeys.has( key ),
						error: errors[ key ],
					};
				},
				onLoadMore,
			} }
			actions={ actions }
			data={ data }
			paginationInfo={ {
				totalItems: data.length,
				totalPages: 1,
			} }
			view={ displayedView }
			onChangeView={ ( nextView ) =>
				setView(
					view.search || nextView.search
						? { ...nextView, showLevels: view.showLevels }
						: nextView
				)
			}
			fields={ fields }
			defaultLayouts={ { table: true } }
		/>
	);
};

export default HierarchicalLevelsComponent;
