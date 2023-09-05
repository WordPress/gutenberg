/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import TemplateActions from '../template-actions';
import AddNewTemplate from '../add-new-template';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import {
	DataTableRows,
	DataTableGlobalSearchInput,
	DataTablePaginationTotalItems,
	DataTablePaginationNumbers,
	DataTablePagination,
	DataTableProvider,
	DataTableActions,
} from '../datatable';

export default function PageTemplates() {
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
					const template = props.row.original;
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
							{ template.description && (
								<Text variant="muted">
									{ decodeEntities( template.description ) }
								</Text>
							) }
						</VStack>
					);
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
						} }
					>
						<VStack>
							<HStack justify="space-between">
								<DataTableGlobalSearchInput />
								<DataTableActions />
							</HStack>
							<DataTableRows className="edit-site-table" />
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
