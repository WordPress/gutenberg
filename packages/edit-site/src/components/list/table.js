/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden, Button } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

export default function Table( { templateType } ) {
	const { templates, isLoading, postType } = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				hasFinishedResolution,
				getPostType,
			} = select( coreStore );

			return {
				templates: getEntityRecords( 'postType', templateType ),
				isLoading: ! hasFinishedResolution( 'getEntityRecords', [
					'postType',
					templateType,
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
		<table className="edit-site-list-table">
			<thead>
				<tr>
					<th>{ __( 'Name' ) }</th>
					<th>{ __( 'Description' ) }</th>
					<th>{ __( 'Theme' ) }</th>
					<th>
						<VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>
					</th>
				</tr>
			</thead>

			<tbody>
				{ templates.map( ( template ) => (
					<tr key={ template.id }>
						<td>
							<a
								href={ addQueryArgs( '', {
									page: 'gutenberg-edit-site',
									postId: template.id,
									postType: template.type,
								} ) }
							>
								{ template.title.rendered }
							</a>
						</td>
						<td>{ template.description }</td>
						<td>{ template.theme }</td>
						<td>
							<Button
								icon={ moreVertical }
								label={ __( 'Actions' ) }
								iconSize={ 24 }
							/>
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
