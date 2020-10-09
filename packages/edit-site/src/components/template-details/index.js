/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../../utils';

export default function TemplateDetails( { template } ) {
	if ( ! template ) {
		return null;
	}
	const { title, description } = getTemplateInfo( template );

	return (
		<div className="edit-site-template-details">
			<p className="edit-site-template-details__heading">
				{ __( 'Template details' ) }
			</p>

			{ title && (
				<p>
					{ sprintf(
						/* translators: %s: Name of the template. */
						_x( 'Name: %s' ),
						title
					) }
				</p>
			) }
			{ description && (
				<p>
					{ sprintf(
						/* translators: %s: Description of the template. */
						_x( 'Description: %s' ),
						description
					) }
				</p>
			) }
		</div>
	);
}
