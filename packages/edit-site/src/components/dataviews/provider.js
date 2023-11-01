/**
 * WordPress dependencies
 */
import {
	useEffect,
	useState,
	useRef,
	useMemo,
	Fragment,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import DataviewsContext from './context';

// DEFAULT_STATUSES is intentionally sorted. Items do not have spaces in between them.
// The reason for that is to match the default statuses coming from the endpoint
// (entity request and useEffect to update the view).
export const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All statuses but 'trash'.

const DEFAULT_VIEWS = {
	page: {
		type: 'list',
		search: '',
		filters: {
			status: DEFAULT_STATUSES,
		},
		page: 1,
		perPage: 5,
		sort: {
			field: 'date',
			direction: 'desc',
		},
		visibleFilters: [ 'author', 'status' ],
		// All fields are visible by default, so it's
		// better to keep track of the hidden ones.
		hiddenFields: [ 'date', 'featured-image' ],
		layout: {},
	},
};

function useDataviewTypeTaxonomyId( type ) {
	const isCreatingATerm = useRef( false );
	const {
		dataViewTypeRecords,
		dataViewTypeIsResolving,
		dataViewTypeIsSaving,
	} = useSelect(
		( select ) => {
			const { getEntityRecords, isResolving, isSavingEntityRecord } =
				select( coreStore );
			const dataViewTypeQuery = { slug: type };
			return {
				dataViewTypeRecords: getEntityRecords(
					'taxonomy',
					'wp_dataviews_type',
					dataViewTypeQuery
				),
				dataViewTypeIsResolving: isResolving( 'getEntityRecords', [
					'taxonomy',
					'wp_dataviews_type',
					dataViewTypeQuery,
				] ),
				dataViewTypeIsSaving: isSavingEntityRecord(
					'taxonomy',
					'wp_dataviews_type'
				),
			};
		},
		[ type ]
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	useEffect( () => {
		if (
			dataViewTypeRecords?.length === 0 &&
			! dataViewTypeIsResolving &&
			! dataViewTypeIsSaving &&
			! isCreatingATerm.current
		) {
			isCreatingATerm.current = true;
			saveEntityRecord( 'taxonomy', 'wp_dataviews_type', { name: type } );
		}
	}, [
		type,
		dataViewTypeRecords,
		dataViewTypeIsResolving,
		dataViewTypeIsSaving,
		saveEntityRecord,
	] );
	useEffect( () => {
		if ( dataViewTypeRecords?.length > 0 ) {
			isCreatingATerm.current = false;
		}
	}, [ dataViewTypeRecords ] );
	useEffect( () => {
		isCreatingATerm.current = false;
	}, [ type ] );
	if ( dataViewTypeRecords?.length > 0 ) {
		return dataViewTypeRecords[ 0 ].id;
	}
	return null;
}

function useDataviews( type, typeTaxonomyId ) {
	const isCreatingADefaultView = useRef( false );
	const { dataViewRecords, dataViewIsLoading, dataViewIsSaving } = useSelect(
		( select ) => {
			const { getEntityRecords, isResolving, isSavingEntityRecord } =
				select( coreStore );
			if ( ! typeTaxonomyId ) {
				return {};
			}
			const dataViewQuery = {
				wp_dataviews_type: typeTaxonomyId,
				orderby: 'date',
				order: 'asc',
			};
			return {
				dataViewRecords: getEntityRecords(
					'postType',
					'wp_dataviews',
					dataViewQuery
				),
				dataViewIsLoading: isResolving( 'getEntityRecords', [
					'postType',
					'wp_dataviews',
					dataViewQuery,
				] ),
				dataViewIsSaving: isSavingEntityRecord(
					'postType',
					'wp_dataviews'
				),
			};
		},
		[ typeTaxonomyId ]
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	useEffect( () => {
		if (
			dataViewRecords?.length === 0 &&
			! dataViewIsLoading &&
			! dataViewIsSaving &&
			! isCreatingADefaultView.current
		) {
			isCreatingADefaultView.current = true;
			saveEntityRecord( 'postType', 'wp_dataviews', {
				title: 'All',
				status: 'publish',
				wp_dataviews_type: typeTaxonomyId,
				content: JSON.stringify( DEFAULT_VIEWS[ type ] ),
			} );
		}
	}, [
		type,
		dataViewIsLoading,
		dataViewRecords,
		dataViewIsSaving,
		typeTaxonomyId,
		saveEntityRecord,
	] );
	useEffect( () => {
		if ( dataViewRecords?.length > 0 ) {
			isCreatingADefaultView.current = false;
		}
	}, [ dataViewRecords ] );
	useEffect( () => {
		isCreatingADefaultView.current = false;
	}, [ typeTaxonomyId ] );
	if ( dataViewRecords?.length > 0 ) {
		return dataViewRecords;
	}
	return null;
}

function DataviewsProvider( { type, children } ) {
	const [ currentViewId, setCurrentViewId ] = useState( null );
	const dataviewTypeTaxonomyId = useDataviewTypeTaxonomyId( type );
	const dataviews = useDataviews( type, dataviewTypeTaxonomyId );
	const { editEntityRecord } = useDispatch( coreStore );
	useEffect( () => {
		if ( ! currentViewId && dataviews?.length > 0 ) {
			setCurrentViewId( dataviews[ 0 ].id );
		}
	}, [ currentViewId, dataviews ] );
	const editedViewRecord = useSelect(
		( select ) => {
			if ( ! currentViewId ) {
				return;
			}
			const { getEditedEntityRecord } = select( coreStore );
			const dataviewRecord = getEditedEntityRecord(
				'postType',
				'wp_dataviews',
				currentViewId
			);
			return dataviewRecord;
		},
		[ currentViewId ]
	);

	const value = useMemo( () => {
		return {
			taxonomyId: dataviewTypeTaxonomyId,
			dataviews,
			currentViewId,
			setCurrentViewId,
			view: editedViewRecord?.content
				? JSON.parse( editedViewRecord?.content )
				: DEFAULT_VIEWS[ type ],
			setView( view ) {
				if ( ! currentViewId ) {
					return;
				}
				editEntityRecord( 'postType', 'wp_dataviews', currentViewId, {
					content: JSON.stringify( view ),
				} );
			},
		};
	}, [
		type,
		dataviewTypeTaxonomyId,
		dataviews,
		currentViewId,
		editedViewRecord?.content,
		editEntityRecord,
	] );

	return (
		<DataviewsContext.Provider value={ value }>
			{ children }
		</DataviewsContext.Provider>
	);
}

let DataviewsProviderExported = Fragment;

// This condition must stand on its own for correct tree-shaking
if ( process.env.IS_GUTENBERG_PLUGIN ) {
	if ( window?.__experimentalAdminViews ) {
		DataviewsProviderExported = DataviewsProvider;
	}
}

export default DataviewsProviderExported;
