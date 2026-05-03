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
	hasArchiveField,
	hierarchicalField,
	publicField,
	statusField,
	supportsField,
	titleField,
	toFormData,
	useSlugField,
	useTaxonomiesField,
	activateAction,
	deactivateAction,
	deletePostTypeAction,
	type PostTypeRecord,
} from '@wordpress/user-post-types';

/**
 * Internal dependencies
 */
import { quickEditPostTypeAction, useEditPostTypeAction } from './actions';
import './style.scss';

const defaultLayouts = {
	table: {},
};

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	fields: [ 'taxonomies', 'status', 'public', 'hierarchical' ],
	titleField: 'title',
	layout: {},
};

function PostTypesPage() {
	const navigate = useNavigate();
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const editAction = useEditPostTypeAction();
	const postTypeActions = useMemo(
		() => [
			editAction,
			quickEditPostTypeAction,
			activateAction,
			deactivateAction,
			deletePostTypeAction,
		],
		[ editAction ]
	);
	const slugField = useSlugField();
	const taxonomiesField = useTaxonomiesField();
	const fields = useMemo(
		() => [
			titleField,
			taxonomiesField,
			statusField,
			publicField,
			slugField,
			hierarchicalField,
			hasArchiveField,
			supportsField,
		],
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
			'wp_user_post_type',
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
			title={ __( 'Post Types' ) }
			className="post-types-page"
			hasPadding={ false }
			actions={
				<Button
					variant="primary"
					size="compact"
					__next40pxDefaultSize
					onClick={ () => navigate( { to: '/edit/new' } ) }
				>
					{ __( 'Add post type' ) }
				</Button>
			}
		>
			<DataViews
				data={ data }
				fields={ fields }
				actions={ postTypeActions }
				view={ view }
				onChangeView={ setView }
				isLoading={ isResolving || ! hasResolved }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ ( item ) => String( item.id ) }
			/>
		</Page>
	);
}

export const stage = PostTypesPage;
