/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { privateApis as corePrivateApis } from '@wordpress/core-data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import { useEvent } from '@wordpress/compose';
import { useView } from '@wordpress/views';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AddNewTemplate from '../add-new-template-legacy';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';
import { authorField, descriptionField, previewField } from './fields';
import {
	defaultLayouts,
	DEFAULT_VIEW,
	getActiveViewOverridesForTab,
} from './view-utils';

const { usePostActions, templateTitleField } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

export default function PageTemplates() {
	const { path, query } = useLocation();
	const { activeView = 'active', postId } = query;
	const [ selection, setSelection ] = useState( [ postId ] );

	const defaultView = DEFAULT_VIEW;
	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab( activeView ),
		[ activeView ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: TEMPLATE_POST_TYPE,
		slug: 'default',
		defaultView,
		activeViewOverrides,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( newQueryParams ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
	} );

	const { records, isResolving: isLoadingData } =
		useEntityRecordsWithPermissions( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
	const history = useHistory();
	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			if ( view?.type === 'list' ) {
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
			return [];
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
		updateView( newView );
		if ( newView.type !== view.type ) {
			// Retrigger the routing areas resolution.
			history.invalidate();
		}
	} );

	return (
		<Page
			className="edit-site-page-templates"
			title={ __( 'Templates' ) }
			actions={
				<>
					{ isModified && (
						<Button
							__next40pxDefaultSize
							onClick={ () => {
								resetToDefault();
								history.invalidate();
							} }
						>
							{ __( 'Reset view' ) }
						</Button>
					) }
					<AddNewTemplate />
				</>
			}
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
