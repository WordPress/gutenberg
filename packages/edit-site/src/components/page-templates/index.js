/**
 * External dependencies
 */
import {
	useReactTable,
	getCoreRowModel,
	createColumnHelper,
} from '@tanstack/react-table';
/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Page from '../page';
import Table from '../table';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import TemplateActions from '../template-actions';
import AddNewTemplate from '../add-new-template';

/**
 * @typedef {Object} RichContent
 * @property {string}        rendered    The rendered content.
 * @property {string}        raw         The raw content.
 *
 * @typedef {Object} Template
 * @property {string}        id          The ID of the template.
 * @property {'wp_template'} type        The type of the template.
 * @property {RichContent}   title       The name of the template.
 * @property {string}        description The description of the template.
 * @property {string}        slug        The slug of the template.
 */

/** @type {import('@tanstack/react-table').ColumnHelper<Template>} */
const columnHelper = createColumnHelper();

const columns = [
	columnHelper.accessor(
		( row ) => decodeEntities( row.title?.rendered || row.slug ),
		{
			id: 'title',
			header: __( 'Template' ),
			cell: ( cell ) => {
				const template = cell.row.original;
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
								{ cell.getValue() }
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
			maxWidth: 400,
		}
	),
	// TODO: Ideally this should be a accessor column, but the data is only fetched asynchronously.
	columnHelper.display( {
		id: 'added-by',
		header: __( 'Added by' ),
		cell: ( { row: { original: template } } ) => (
			<AddedBy postType={ template.type } postId={ template.id } />
		),
	} ),
	columnHelper.display( {
		id: 'actions',
		header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
		cell: ( { row: { original: template } } ) => (
			<TemplateActions
				postType={ template.type }
				postId={ template.id }
			/>
		),
	} ),
];

export default function PageTemplates() {
	/** @type {{records: Template[] | null}} */
	const { records: templates } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	const table = useReactTable( {
		data: templates,
		columns,
		getCoreRowModel: getCoreRowModel(),
	} );

	return (
		<Page
			title={ __( 'Templates' ) }
			actions={
				<AddNewTemplate
					templateType={ 'wp_template' }
					showIcon={ false }
					toggleProps={ { variant: 'primary' } }
				/>
			}
		>
			{ templates && <Table table={ table } /> }
		</Page>
	);
}
