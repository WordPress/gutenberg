/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Dropdown, ToolbarItem, Button } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import DeleteTemplate from './delete-template';
import EditTemplateTitle from './edit-template-title';
import TemplateDescription from './template-description';

function TemplateTitle() {
	const { template, isEditing, title } = useSelect( ( select ) => {
		const { isEditingTemplate, getEditedPostTemplate } = select(
			editPostStore
		);
		const { getEditedPostAttribute } = select( editorStore );

		const _isEditing = isEditingTemplate();

		return {
			template: _isEditing ? getEditedPostTemplate() : null,
			isEditing: _isEditing,
			title: getEditedPostAttribute( 'title' ),
		};
	}, [] );

	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setIsEditingTemplate } = useDispatch( editPostStore );

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
		<ToolbarItem>
			{ ( toolbarItemHTMLProps ) => {
				return (
					<Dropdown
						className="edit-post-template-top-area"
						position="bottom center"
						contentClassName="edit-post-template-top-area__popover"
						renderToggle={ ( { onToggle } ) => (
							<>
								<Button
									{ ...toolbarItemHTMLProps }
									className="edit-post-template-post-title"
									isLink
									showTooltip
									label={ sprintf(
										/* translators: %s: Title of the referring post, e.g: "Hello World!" */
										__( 'Edit %s' ),
										title
									) }
									onClick={ () => {
										clearSelectedBlock();
										setIsEditingTemplate( false );
									} }
								>
									{ title }
								</Button>
								<Button
									{ ...toolbarItemHTMLProps }
									className="edit-post-template-title"
									isLink
									icon={ chevronDown }
									showTooltip
									onClick={ onToggle }
									label={ __( 'Template Options' ) }
								>
									{ templateTitle }
								</Button>
							</>
						) }
						renderContent={ () => (
							<>
								{ template.has_theme_file ? (
									<TemplateDescription />
								) : (
									<EditTemplateTitle />
								) }
								<DeleteTemplate />
							</>
						) }
					/>
				);
			} }
		</ToolbarItem>
	);
}

export default TemplateTitle;
