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
import AddNewTemplatePart from './add-new-template-part';

/**
 * @typedef {Object} RichContent
 * @property {string}             rendered    The rendered content.
 * @property {string}             raw         The raw content.
 *
 * @typedef {Object} TemplatePart
 * @property {string}             id          The ID of the template.
 * @property {'wp_template_part'} type        The type of the template.
 * @property {RichContent}        title       The name of the template.
 * @property {string}             description The description of the template.
 * @property {string}             slug        The slug of the template.
 */

/** @type {import('@tanstack/react-table').ColumnHelper<TemplatePart>} */
const columnHelper = createColumnHelper();

const columns = [
	columnHelper.accessor(
		( row ) => decodeEntities( row.title?.rendered || row.slug ),
		{
			id: 'title',
			header: __( 'Template Part' ),
			cell: ( cell ) => {
				const templatePart = cell.row.original;
				return (
					<VStack>
						<Heading as="h3" level={ 5 }>
							<Link
								params={ {
									postId: templatePart.id,
									postType: templatePart.type,
								} }
								state={ { backPath: '/wp_template_part/all' } }
							>
								{ cell.getValue() }
							</Link>
						</Heading>
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
		cell: ( { row: { original: templatePart } } ) => (
			<AddedBy
				postType={ templatePart.type }
				postId={ templatePart.id }
			/>
		),
	} ),
	columnHelper.display( {
		id: 'actions',
		header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
		cell: ( { row: { original: templatePart } } ) => (
			<TemplateActions
				postType={ templatePart.type }
				postId={ templatePart.id }
			/>
		),
	} ),
];

export default function PageTemplateParts() {
	/** @type {{records: TemplatePart[] | null}} */
	const { records: templateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{
			per_page: -1,
		}
	);

	const table = useReactTable( {
		data: templateParts,
		columns,
		getCoreRowModel: getCoreRowModel(),
		enableSorting: false,
	} );

	return (
		<Page
			title={ __( 'Template Parts' ) }
			actions={ <AddNewTemplatePart /> }
		>
			{ templateParts && <Table table={ table } /> }
		</Page>
	);
}
