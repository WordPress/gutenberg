/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import { default as AddedBy, useAddedBy } from '../list/added-by';
import TemplateActions from '../template-actions';
import AddNewTemplate from '../add-new-template';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import {
	DataTableRows,
	DataTableGlobalSearchInput,
	DataTablePaginationTotalItems,
	DataTablePaginationNumbers,
	DataTablePagination,
	DataTableProvider,
	DataTableActions,
} from '../datatable';
import TemplatesBulkActions from './templates-bulk-actions';

function TemplateTitle( props ) {
	const template = props.row.original;
	const { isCustomized } = useAddedBy( template.type, template.id );
	return (
		<VStack>
			<Heading as="h3" level={ 5 }>
				<Link
					params={ {
						postId: template.id,
						postType: template.type,
						canvas: 'edit',
					} }
				>
					{ decodeEntities( props.getValue() ) }
				</Link>
			</Heading>
			<span>
				{ isCustomized && (
					<span className="edit-site-list-added-by__customized-info">
						{ template.type === 'wp_template'
							? _x( 'Customized', 'template' )
							: _x( 'Customized', 'template part' ) }
					</span>
				) }
			</span>
		</VStack>
	);
}

export default function PageTemplates() {
	const [ bulkActionsAnchor, setBulkActionsAnchor ] = useState();
	const { records: templates } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{
			per_page: -1,
		}
	);
	const columns = useMemo(
		() => [
			{
				header: __( 'Template' ),
				id: 'title',
				accessorFn: ( template ) =>
					template.title?.rendered || template.slug,
				cell: ( props ) => {
					return <TemplateTitle { ...props } />;
				},
				maxSize: 400,
				sortingFn: 'alphanumeric',
				enableHiding: false,
			},
			{
				header: __( 'Added by' ),
				id: 'addedBy',
				cell: ( props ) => {
					const template = props.row.original;
					return (
						<AddedBy
							postType={ template.type }
							postId={ template.id }
							// We need to split the AddedBy component both for design and checks for filters etc..
							showIsCustomizedInfo={ false }
						/>
					);
				},
			},
			{
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					const template = props.row.original;
					return (
						<TemplateActions
							postType={ template.type }
							postId={ template.id }
						/>
					);
				},
				enableHiding: false,
			},
		],
		[]
	);

	return (
		<Page
			title={ __( 'Templates' ) }
			actions={
				<AddNewTemplate
					templateType={ TEMPLATE_POST_TYPE }
					showIcon={ false }
					toggleProps={ { variant: 'primary' } }
				/>
			}
		>
			{ templates && (
				<div className="edit-site-table-wrapper">
					<DataTableProvider
						data={ templates }
						columns={ columns }
						options={ {
							initialState: {
								pagination: { pageSize: 2 },
							},
							enableRowSelection: ( { original: template } ) =>
								isTemplateRemovable( template ) ||
								isTemplateRevertable( template ),
						} }
					>
						<VStack>
							<HStack justify="space-between">
								<DataTableGlobalSearchInput />
								<DataTableActions />
							</HStack>
							<DataTableRows
								ref={ setBulkActionsAnchor }
								className="edit-site-table"
							/>
							<TemplatesBulkActions
								anchor={ bulkActionsAnchor }
							/>
							<HStack justify="space-between">
								<DataTablePaginationTotalItems />
								<DataTablePaginationNumbers />
							</HStack>
							<HStack justify="flex-start">
								<DataTablePagination />
							</HStack>
						</VStack>
					</DataTableProvider>
				</div>
			) }
		</Page>
	);
}
