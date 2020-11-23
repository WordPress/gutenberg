/* global wp */
/**
 * Returns arguments inherited from the template-type.
 */
export const getTemplateQuery = () => {
	const templateType = wp.data.select( 'core/edit-site' ).getTemplateType();
	if ( 'wp_template' === templateType ) {
		const templateId = wp.data.select( 'core/edit-site' ).getTemplateId();
		const template = wp.data
			.select( 'core' )
			.getEntityRecord( 'postType', 'wp_template', templateId );

		// Change the post-type if needed.
		if (
			'attachment' === template.slug ||
			0 === template.slug.indexOf( 'archive-' )
		) {
			return { postType: template.slug.replace( 'archive-', '' ) };
		}
	}

	return {};
};
