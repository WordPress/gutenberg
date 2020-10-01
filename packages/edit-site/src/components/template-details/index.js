/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function TemplateDetails( { template } ) {
	if ( ! template ) {
		return null;
	}
	const templateDescription = __(
		'In the future, we will display more information about the template here.'
	);

	return (
		<div className="edit-site-template-details">
			<p className="edit-site-template-details__heading">
				{ __( 'Template details' ) }
			</p>
			<p>{ `${ __( 'Name' ) }: ${ template.slug }` }</p>
			<p>{ `${ __( 'Description' ) }: ${ templateDescription }` }</p>
		</div>
	);
}
