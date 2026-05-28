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
import deleteTaxonomyAction from './actions/delete';
import duplicateTaxonomyAction from './actions/duplicate';
import viewTermsAction from './actions/view-terms';
import {
	countField,
	hierarchicalField,
	publicField,
	useObjectTypeField,
	useSlugField,
} from './fields';
import { statusField, titleField } from '../utils/fields';
import type { TaxonomyFormData, TaxonomyRecord } from './types';
import { toFormData } from './utils';
import { useEditTaxonomyAction } from './actions/edit';
import quickEditTaxonomyAction from './actions/quick-edit';
import { NEW_ID, TAXONOMIES_PATH, TAXONOMY_ENTITY } from '../constants';

const defaultLayouts = {
	table: {},
};

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	fields: [ 'object_type', 'count', 'status' ],
	titleField: 'title',
	layout: {
		styles: {
			object_type: { minWidth: 230 },
		},
	},
};

export function TaxonomiesList() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: TAXONOMIES_PATH } );
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
		name: TAXONOMY_ENTITY,
		slug: 'default',
		defaultView: DEFAULT_VIEW,
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );
	const editAction = useEditTaxonomyAction();
	const taxonomyActions = useMemo(
		() => [
			editAction,
			quickEditTaxonomyAction,
			duplicateTaxonomyAction,
			viewTermsAction,
			activateAction,
			deactivateAction,
			deleteTaxonomyAction,
		],
		[ editAction ]
	);
	const slugField = useSlugField();
	const objectTypeField = useObjectTypeField();
	const fields = useMemo(
		() =>
			[
				titleField,
				objectTypeField,
				countField,
				statusField,
				publicField,
				slugField,
				hierarchicalField,
			] as Field< TaxonomyFormData >[],
		[ slugField, objectTypeField ]
	);
	const queryArgs = useMemo( () => {
		const statusFilter = view.filters?.find(
			( filter ) => filter.field === 'status'
		);
		const objectTypeFilter = view.filters?.find(
			( filter ) => filter.field === 'object_type'
		);
		return {
			per_page: view.perPage,
			page: view.page,
			context: 'edit',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			status: statusFilter?.value ?? [ 'publish', 'draft' ],
			object_type: objectTypeFilter?.value,
		};
	}, [ view ] );
	const { records, isResolving, hasResolved, totalItems, totalPages } =
		useEntityRecords< TaxonomyRecord >(
			'postType',
			TAXONOMY_ENTITY,
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
		<DataViews< TaxonomyFormData >
			data={ data }
			fields={ fields }
			actions={ taxonomyActions }
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
					to: `${ TAXONOMIES_PATH }/${ item.id }`,
				} )
			}
			header={
				<Button
					variant="primary"
					size="compact"
					__next40pxDefaultSize
					onClick={ () =>
						navigate( {
							to: `${ TAXONOMIES_PATH }/${ NEW_ID }`,
						} )
					}
				>
					{ __( 'Add taxonomy' ) }
				</Button>
			}
		/>
	);
}
