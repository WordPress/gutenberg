/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useView } from '@wordpress/views';
import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	altTextField,
	attachedToField,
	authorField,
	captionField,
	dateAddedField,
	dateModifiedField,
	descriptionField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
} from '@wordpress/media-fields';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions } = unlock( editorPrivateApis );

const EMPTY_ARRAY = [];

const LAYOUT_TABLE = 'table';
const LAYOUT_GRID = 'grid';
const LAYOUT_LIST = 'list';

function getItemId( item ) {
	return String( item.id );
}

const STATIC_FIELDS = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Title' ),
		getValue( { item } ) {
			return (
				item.title?.raw || item.title?.rendered || __( '(no title)' )
			);
		},
		render( { item } ) {
			return (
				<div className="edit-site-media-list__title-cell">
					{ item.mime_type?.startsWith( 'image/' ) &&
					item.source_url ? (
						<img
							src={ item.source_url }
							alt=""
							width={ 25 }
							height={ 25 }
							className="edit-site-media-list__inline-thumb"
						/>
					) : null }
					<span>
						{ item.title?.raw ||
							item.title?.rendered ||
							__( '(no title)' ) }
					</span>
				</div>
			);
		},
	},
	{
		...authorField,
		type: 'text',
	},
	attachedToField,
	{
		id: 'comment_count',
		type: 'text',
		label: __( 'Comments' ),
		getValue( { item } ) {
			return item.comment_count ?? 0;
		},
	},
	dateAddedField,
	dateModifiedField,
	altTextField,
	captionField,
	descriptionField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
];

const defaultView = {
	type: LAYOUT_TABLE,
	fields: [ 'author', 'attached_to', 'comment_count', 'date' ],
	showTitle: true,
	titleField: 'title',
	mediaField: 'media_thumbnail',
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	filters: [],
};

const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		fields: [ 'title', 'author', 'attached_to', 'comment_count', 'date' ],
		showTitle: true,
	},
	[ LAYOUT_GRID ]: {
		fields: [ 'media_thumbnail' ],
		showTitle: true,
		layout: {
			previewSize: 170,
			density: 'compact',
		},
	},
	[ LAYOUT_LIST ]: {
		fields: [],
		showTitle: true,
	},
};

export default function MediaList() {
	const { path, query } = useLocation();
	const history = useHistory();

	const userId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);

	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: 'attachment',
		slug: 'default',
		defaultView,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams( newQueryParams ) {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
	} );

	const onChangeView = useEvent( ( newView ) => {
		updateView( newView );
		if ( newView.type !== view.type ) {
			history.invalidate();
		}
	} );

	const [ selection, setSelection ] = useState( [] );
	const onChangeSelection = useCallback( ( items ) => {
		setSelection( items );
	}, [] );

	const fields = STATIC_FIELDS;

	const queryArgs = useMemo( () => {
		const filters = {};

		if ( query.sidebarFilter === 'my-files' ) {
			filters.author = userId;
		} else if ( query.sidebarFilter && query.sidebarFilter !== 'all' ) {
			filters.media_type = query.sidebarFilter;
		}

		if ( view.filters ) {
			for ( const filter of view.filters ) {
				if ( filter.field === 'media_type' ) {
					filters.media_type = filter.value;
				} else if ( filter.field === 'author' ) {
					if ( filter.operator === 'isAny' ) {
						filters.author = filter.value;
					} else if ( filter.operator === 'isNone' ) {
						filters.author_exclude = filter.value;
					}
				} else if (
					filter.field === 'date' ||
					filter.field === 'modified'
				) {
					if ( filter.operator === 'before' ) {
						filters.before = filter.value;
					} else if ( filter.operator === 'after' ) {
						filters.after = filter.value;
					}
				} else if ( filter.field === 'mime_type' ) {
					filters.mime_type = filter.value;
				}
			}
		}

		return {
			per_page: view.perPage || 20,
			page: view.page || 1,
			status: 'inherit',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			_embed: 'author,wp:attached-to',
			...filters,
		};
	}, [ view, query.sidebarFilter, userId ] );

	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
		hasResolved,
	} = useEntityRecordsWithPermissions( 'postType', 'attachment', queryArgs );

	const data = records;

	const ids = data?.map( getItemId ) ?? [];
	const prevIds = usePrevious( ids ) ?? [];
	const deletedIds = prevIds.filter( ( id ) => ! ids.includes( id ) );
	const postIdWasDeleted =
		query.postId && deletedIds.includes( query.postId );

	useEffect( () => {
		if ( postIdWasDeleted ) {
			history.navigate( addQueryArgs( path, { postId: undefined } ) );
		}
	}, [ history, postIdWasDeleted, path ] );

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const labels = useSelect(
		( select ) => select( coreStore ).getPostType( 'attachment' )?.labels,
		[]
	);

	const canCreateRecord = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'attachment',
			} ),
		[]
	);

	const attachmentActions = usePostActions( {
		postType: 'attachment',
		context: 'list',
	} );

	const actions = useMemo( () => {
		return [
			{
				id: 'download',
				label: __( 'Download' ),
				isPrimary: false,
				supportsBulk: false,
				callback( [ item ] ) {
					if ( item?.source_url ) {
						window.open( item.source_url, '_blank' );
					}
				},
			},
			...attachmentActions,
		];
	}, [ attachmentActions ] );

	const handleOnClickItem = useEvent( ( { id } ) => {
		history.navigate( addQueryArgs( path, { postId: id } ) );
	} );

	return (
		<Page
			title={ labels?.name || __( 'Media' ) }
			headingLevel={ 2 }
			actions={
				canCreateRecord && (
					<Button
						variant="primary"
						onClick={ () =>
							window.open(
								addQueryArgs( 'upload.php', {} ),
								'_blank'
							)
						}
						size="compact"
						__next40pxDefaultSize
					>
						{ __( 'Add New Media' ) }
					</Button>
				)
			}
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data || EMPTY_ARRAY }
				isLoading={ isLoadingData || ! hasResolved }
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				onClickItem={ handleOnClickItem }
				isItemClickable={ () => true }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				onReset={
					isModified
						? () => {
								resetToDefault();
								history.invalidate();
						  }
						: false
				}
			/>
		</Page>
	);
}
