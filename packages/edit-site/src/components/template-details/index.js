/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
			<p>{ `${ __( 'Name' ) }: ${ title }` }</p>
			<p>{ `${ __( 'Description' ) }: ${ description }` }</p>
		</div>
	);
}
