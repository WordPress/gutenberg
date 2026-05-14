/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { useEntityRecords } from '@wordpress/core-data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { useView } from '@wordpress/views';

/**
 * Internal dependencies
 */
import activateAction from './actions/activate';
import deactivateAction from './actions/deactivate';
import deletePostTypeAction from './actions/delete';
import duplicatePostTypeAction from './actions/duplicate';
import viewPostsAction from './actions/view-posts';
import {
	countField,
	hasArchiveField,
	hierarchicalField,
	publicField,
	supportsField,
	useSlugField,
	useTaxonomiesField,
} from './fields';
import { statusField, titleField } from '../utils/fields';
import type { PostTypeFormData, PostTypeRecord } from './types';
import { toFormData } from './utils';
import { useEditPostTypeAction } from './actions/edit';
import quickEditPostTypeAction from './actions/quick-edit';
import { NEW_ID, POST_TYPE_ENTITY, POST_TYPES_PATH } from '../constants';

const defaultLayouts = {
	table: {},
};

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	fields: [ 'taxonomies', 'count', 'status' ],
	titleField: 'title',
	layout: {
		styles: {
			taxonomies: { minWidth: 230 },
			supports: { minWidth: 230 },
		},
	},
};

export function PostTypesList() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: POST_TYPES_PATH } );
	const handleQueryParamsChange = useCallback(
		( params: { page?: number; search?: string } ) => {
			navigate( {
				search: {
					...searchParams,
					...params,
				},
			} );
		},
		[ searchParams, navigate ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: POST_TYPE_ENTITY,
		slug: 'default',
		defaultView: DEFAULT_VIEW,
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );
	const editAction = useEditPostTypeAction();
	const postTypeActions = useMemo(
		() => [
			editAction,
			quickEditPostTypeAction,
			duplicatePostTypeAction,
			viewPostsAction,
			activateAction,
			deactivateAction,
			deletePostTypeAction,
		],
		[ editAction ]
	);
	const slugField = useSlugField();
	const taxonomiesField = useTaxonomiesField();
	const fields = useMemo(
		() =>
			[
				titleField,
				taxonomiesField,
				countField,
				statusField,
				publicField,
				slugField,
				hierarchicalField,
				hasArchiveField,
				supportsField,
			] as Field< PostTypeFormData >[],
		[ slugField, taxonomiesField ]
	);
	const queryArgs = useMemo( () => {
		const statusFilter = view.filters?.find(
			( filter ) => filter.field === 'status'
		);
		return {
			per_page: view.perPage,
			page: view.page,
			context: 'edit',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			status: statusFilter?.value ?? [ 'publish', 'draft' ],
		};
	}, [ view ] );
	const { records, isResolving, hasResolved, totalItems, totalPages } =
		useEntityRecords< PostTypeRecord >(
			'postType',
			POST_TYPE_ENTITY,
			queryArgs
		);
	const data = useMemo(
		() => ( records ?? [] ).map( toFormData ),
		[ records ]
	);
	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems ?? 0,
			totalPages: totalPages ?? 0,
		} ),
		[ totalItems, totalPages ]
	);
	return (
		<DataViews< PostTypeFormData >
			data={ data }
			fields={ fields }
			actions={ postTypeActions }
			view={ view }
			onChangeView={ updateView }
			onReset={ isModified ? resetToDefault : false }
			isLoading={ isResolving || ! hasResolved }
			paginationInfo={ paginationInfo }
			defaultLayouts={ defaultLayouts }
			getItemId={ ( item ) => String( item.id ) }
			isItemClickable={ () => true }
			onClickItem={ ( item ) =>
				navigate( {
					to: `${ POST_TYPES_PATH }/${ item.id }`,
				} )
			}
			header={
				<Button
					variant="primary"
					size="compact"
					__next40pxDefaultSize
					onClick={ () =>
						navigate( {
							to: `${ POST_TYPES_PATH }/${ NEW_ID }`,
						} )
					}
				>
					{ __( 'Add post type' ) }
				</Button>
			}
		/>
	);
}
