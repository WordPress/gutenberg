/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';

/**
 * Internal dependencies
 */
import activateAction from './actions/activate';
import deactivateAction from './actions/deactivate';
import deletePostTypeAction from './actions/delete';
import duplicatePostTypeAction from './actions/duplicate';
import {
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
	fields: [ 'taxonomies', 'status', 'public', 'hierarchical' ],
	titleField: 'title',
	layout: {},
};

export function PostTypesList() {
	const navigate = useNavigate();
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const editAction = useEditPostTypeAction();
	const postTypeActions = useMemo(
		() => [
			editAction,
			quickEditPostTypeAction,
			duplicatePostTypeAction,
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
			onChangeView={ setView }
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
