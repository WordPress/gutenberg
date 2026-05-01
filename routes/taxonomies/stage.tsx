/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { DataViews, type View } from '@wordpress/dataviews';
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import {
	hierarchicalField,
	publicField,
	statusField,
	titleField,
	toFormData,
	useObjectTypeField,
	useSlugField,
	activateAction,
	deactivateAction,
	deleteTaxonomyAction,
	type TaxonomyRecord,
} from '@wordpress/user-taxonomies';

/**
 * Internal dependencies
 */
import { quickEditTaxonomyAction, useEditTaxonomyAction } from './actions';
import './style.scss';

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

function TaxonomiesPage() {
	const navigate = useNavigate();
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const editAction = useEditTaxonomyAction();
	const taxonomyActions = useMemo(
		() => [
			editAction,
			quickEditTaxonomyAction,
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
			'wp_user_taxonomy',
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
		<Page
			title={ __( 'Taxonomies' ) }
			className="taxonomies-page"
			hasPadding={ false }
			actions={
				<Button
					variant="primary"
					size="compact"
					__next40pxDefaultSize
					onClick={ () => navigate( { to: '/edit/new' } ) }
				>
					{ __( 'Add taxonomy' ) }
				</Button>
			}
		>
			<DataViews
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
					navigate( { to: `/edit/${ item.id }` } )
				}
			/>
		</Page>
	);
}

export const stage = TaxonomiesPage;
