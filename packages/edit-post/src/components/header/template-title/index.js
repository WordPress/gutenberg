/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

function TemplateTitle() {
	const { template, isEditing } = useSelect( ( select ) => {
		const { isEditingTemplate, getEditedPostTemplate } = select(
			editPostStore
		);
		const _isEditing = isEditingTemplate();
		return {
			template: _isEditing ? getEditedPostTemplate() : null,
			isEditing: _isEditing,
		};
	}, [] );

	if ( ! isEditing || ! template ) {
		return null;
	}

	return (
		<span className="edit-post-template-title">
			{
				/* translators: 1: Template name. */
				sprintf( __( 'Editing template: %s' ), template.slug )
			}
		</span>
	);
}

export default TemplateTitle;
