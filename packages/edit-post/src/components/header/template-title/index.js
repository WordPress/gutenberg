/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { Button, Dropdown } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';
import DeleteTemplate from './delete-template';
import EditTemplateTitle from './edit-template-title';

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

	let templateTitle = __( 'Default' );
	if ( template?.title ) {
		templateTitle = template.title;
	} else if ( !! template ) {
		templateTitle = template.slug;
	}

	return (
		<Dropdown
			position="bottom center"
			className="edit-post-template-top-area"
			contentClassName="edit-post-template-top-area__popover"
			renderToggle={ ( { onToggle } ) => (
				<>
					<div className="edit-post-template-title">
						{ __( 'About' ) }
					</div>
					<Button
						isSmall
						isTertiary
						onClick={ onToggle }
						aria-label={ __( 'Template Options' ) }
					>
						{ templateTitle }
					</Button>
				</>
			) }
			renderContent={ () => (
				<>
					<EditTemplateTitle />
					<DeleteTemplate />
				</>
			) }
		/>
	);
}

export default TemplateTitle;
