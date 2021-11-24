/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	VisuallyHidden,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';

function Actions( { template } ) {
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const isRemovable = isTemplateRemovable( template );
	const isRevertable = isTemplateRevertable( template );

	if ( ! isRemovable && ! isRevertable ) {
		return null;
	}

	async function revertAndSaveTemplate() {
		await revertTemplate( template, { allowUndo: false } );
		await saveEditedEntityRecord( 'postType', template.type, template.id );
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className="edit-site-list-table__actions"
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ isRemovable && (
						<MenuItem
							onClick={ () => {
								removeTemplate( template );
								onClose();
							} }
						>
							{ __( 'Remove template' ) }
						</MenuItem>
					) }
					{ isRevertable && (
						<MenuItem
							info={ __( 'Restore template to theme default' ) }
							onClick={ () => {
								revertAndSaveTemplate();
								onClose();
							} }
						>
							{ __( 'Clear customizations' ) }
						</MenuItem>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}

export default function Table( { templateType } ) {
	const { templates, isLoading, postType } = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				hasFinishedResolution,
				getPostType,
			} = select( coreStore );

			return {
				templates: getEntityRecords( 'postType', templateType, {
					per_page: -1,
				} ),
				isLoading: ! hasFinishedResolution( 'getEntityRecords', [
					'postType',
					templateType,
					{ per_page: -1 },
				] ),
				postType: getPostType( templateType ),
			};
		},
		[ templateType ]
	);

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
		// These explicit aria roles are needed for Safari.
		// See https://developer.mozilla.org/en-US/docs/Web/CSS/display#tables
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
					<th
						className="edit-site-list-table-column"
						role="columnheader"
					>
						<VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>
					</th>
				</tr>
			</thead>

			<tbody>
				{ templates.map( ( template ) => (
					<tr
						key={ template.id }
						className="edit-site-list-table-row"
						role="row"
					>
						<td className="edit-site-list-table-column" role="cell">
							<a
								href={ addQueryArgs( window.location.href, {
									postId: template.id,
									postType: template.type,
								} ) }
							>
								{ template.title.rendered }
							</a>
							{ template.description }
						</td>

						<td className="edit-site-list-table-column" role="cell">
							{ template.theme }
						</td>
						<td className="edit-site-list-table-column" role="cell">
							<Actions template={ template } />
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
