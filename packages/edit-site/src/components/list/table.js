/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Link from '../routes/link';
import Actions from './actions';
import AddedBy from './added-by';

export default function Table( {
	templateType,
	postType,
	templates,
	isLoading,
	heading,
	templateHeadingLevel,
	showActionsColumn = false,
} ) {
	if ( ! templates || isLoading ) {
		return null;
	}

	if ( ! templates.length ) {
		return (
			<div>
				{ sprintf(
					// translators: The template type name, should be either "templates" or "template parts".
					__( 'No %s found.' ),
					postType?.labels?.name?.toLowerCase()
				) }
			</div>
		);
	}

	return (
		<>
			{ heading && (
				<Heading
					level={ 2 }
					size={ 18 }
					className="edit-site-list__table-label"
				>
					{ heading }
				</Heading>
			) }
			{
				// These explicit aria roles are needed for Safari. See
				// https://developer.mozilla.org/en-US/docs/Web/CSS/display#tables
			 }
			<table className="edit-site-list-table" role="table">
				<thead>
					<tr className="edit-site-list-table-head" role="row">
						<th
							className="edit-site-list-table-column"
							role="columnheader"
						>
							{ __( 'Template' ) }
						</th>
						<th
							className="edit-site-list-table-column"
							role="columnheader"
						>
							{ __( 'Added by' ) }
						</th>
						{ showActionsColumn && (
							<th
								className="edit-site-list-table-column"
								role="columnheader"
							>
								{ __( 'Actions' ) }
							</th>
						) }
					</tr>
				</thead>

				<tbody>
					{ templates.map( ( template ) => (
						<tr
							key={ template.id }
							className="edit-site-list-table-row"
							role="row"
						>
							<td
								className="edit-site-list-table-column"
								role="cell"
							>
								<Heading
									level={ templateHeadingLevel }
									size={ 16 }
								>
									<Link
										params={ {
											postId: template.id,
											postType: template.type,
										} }
									>
										{ decodeEntities(
											template.title?.rendered ||
												template.slug
										) }
									</Link>
								</Heading>
								{ decodeEntities( template.description ) }
							</td>
							<td
								className="edit-site-list-table-column"
								role="cell"
							>
								<AddedBy
									templateType={ templateType }
									template={ template }
								/>
							</td>
							{ showActionsColumn && (
								<td
									className="edit-site-list-table-column"
									role="cell"
								>
									<Actions template={ template } />
								</td>
							) }
						</tr>
					) ) }
				</tbody>
			</table>
		</>
	);
}
