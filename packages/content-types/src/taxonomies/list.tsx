/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews, type View } from '@wordpress/dataviews';
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';

/**
 * Internal dependencies
 */
import activateAction from './actions/activate';
import deactivateAction from './actions/deactivate';
import deleteTaxonomyAction from './actions/delete';
import duplicateTaxonomyAction from './actions/duplicate';
import {
	hierarchicalField,
	publicField,
	statusField,
	titleField,
	useObjectTypeField,
	useSlugField,
} from './fields';
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
	fields: [ 'object_type', 'status', 'public' ],
	titleField: 'title',
	layout: {},
};

export function TaxonomiesList() {
	const navigate = useNavigate();
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const editAction = useEditTaxonomyAction();
	const taxonomyActions = useMemo(
		() => [
			editAction,
			quickEditTaxonomyAction,
			duplicateTaxonomyAction,
			activateAction,
			deactivateAction,
			deleteTaxonomyAction,
		],
		[ editAction ]
	);
	const slugField = useSlugField();
	const objectTypeField = useObjectTypeField();
	const fields = useMemo(
		() => [
			titleField,
			objectTypeField,
			statusField,
			publicField,
			slugField,
			hierarchicalField,
		],
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
			onChangeView={ setView }
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
