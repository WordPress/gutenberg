/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as corePrivateApis } from '@wordpress/core-data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Page from '../page';
import AddNewTemplate from '../add-new-template';
import {
	TEMPLATE_POST_TYPE,
	OPERATOR_IS_ANY,
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';
import { authorField, descriptionField, previewField } from './fields';
import { useEvent } from '@wordpress/compose';

const { usePostActions, templateTitleField } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

const EMPTY_ARRAY = [];

const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		showMedia: false,
	},
	[ LAYOUT_GRID ]: {
		showMedia: true,
	},
	[ LAYOUT_LIST ]: {
		showMedia: false,
	},
};

const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
	fields: [ 'author' ],
	filters: [],
	...defaultLayouts[ LAYOUT_GRID ],
};

export default function PageTemplates() {
	const { path, query } = useLocation();
	const { activeView = 'all', layout, postId } = query;
	const [ selection, setSelection ] = useState( [ postId ] );

	const defaultView = useMemo( () => {
		const usedType = layout ?? DEFAULT_VIEW.type;
		return {
			...DEFAULT_VIEW,
			type: usedType,
			filters:
				activeView !== 'all'
					? [
							{
								field: 'author',
								operator: 'isAny',
								value: [ activeView ],
							},
					  ]
					: [],
			...defaultLayouts[ usedType ],
		};
	}, [ layout, activeView ] );
	const [ view, setView ] = useState( defaultView );

	// Sync the layout from the URL to the view state.
	useEffect( () => {
		setView( ( currentView ) => ( {
			...currentView,
			type: layout ?? DEFAULT_VIEW.type,
		} ) );
	}, [ setView, layout ] );

	// Sync the active view from the URL to the view state.
	useEffect( () => {
		setView( ( currentView ) => ( {
			...currentView,
			filters:
				activeView !== 'all'
					? [
							{
								field: 'author',
								operator: OPERATOR_IS_ANY,
								value: [ activeView ],
							},
					  ]
					: [],
		} ) );
	}, [ setView, activeView ] );

	const { records, isResolving: isLoadingData } =
		useEntityRecordsWithPermissions( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
	const history = useHistory();
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			if ( view?.type === LAYOUT_LIST ) {
				history.navigate(
					addQueryArgs( path, {
						postId: items.length === 1 ? items[ 0 ] : undefined,
					} )
				);
			}
		},
		[ history, path, view?.type ]
	);

	const authors = useMemo( () => {
		if ( ! records ) {
			return EMPTY_ARRAY;
		}
		const authorsSet = new Set();
		records.forEach( ( template ) => {
			authorsSet.add( template.author_text );
		} );
		return Array.from( authorsSet ).map( ( author ) => ( {
			value: author,
			label: author,
		} ) );
	}, [ records ] );

	const fields = useMemo(
		() => [
			previewField,
			templateTitleField,
			descriptionField,
			{
				...authorField,
				elements: authors,
			},
		],
		[ authors ]
	);

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( records, view, fields );
	}, [ records, view, fields ] );

	const postTypeActions = usePostActions( {
		postType: TEMPLATE_POST_TYPE,
		context: 'list',
	} );
	const editAction = useEditPostAction();
	const actions = useMemo(
		() => [ editAction, ...postTypeActions ],
		[ postTypeActions, editAction ]
	);

	const onChangeView = useEvent( ( newView ) => {
		setView( newView );
		if ( newView.type !== layout ) {
			history.navigate(
				addQueryArgs( path, {
					layout: newView.type,
				} )
			);
		}
	} );

	return (
		<Page
			className="edit-site-page-templates"
			title={ __( 'Templates' ) }
			actions={ <AddNewTemplate /> }
		>
			<DataViews
				key={ activeView }
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ () => true }
				onClickItem={ ( { id } ) => {
					history.navigate( `/wp_template/${ id }?canvas=edit` );
				} }
				selection={ selection }
				defaultLayouts={ defaultLayouts }
			/>
		</Page>
	);
}
