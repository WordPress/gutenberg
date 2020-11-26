/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

function PostTemplate() {
	const { template, isEditing, isFSETheme } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { __experimentalGetTemplateForLink } = select( coreStore );
		const { isEditingTemplate } = select( editPostStore );
		const link = getEditedPostAttribute( 'link' );
		const isFSEEnabled = select( editorStore ).getEditorSettings()
			.isFSETheme;
		return {
			template:
				isFSEEnabled && link
					? __experimentalGetTemplateForLink( link )
					: null,
			isEditing: isEditingTemplate(),
			isFSETheme: isFSEEnabled,
		};
	}, [] );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	if ( ! isFSETheme || ! template ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-post-template">
			<span>{ __( 'Template' ) }</span>
			{ ! isEditing && (
				<span className="edit-post-post-template__value">
					{ createInterpolateElement(
						sprintf(
							/* translators: 1: Template name. */
							__( '%s (<a>Edit</a>)' ),
							template.post_title
						),
						{
							a: (
								<Button
									isLink
									onClick={ () => {
										setIsEditingTemplate( true );
										createSuccessNotice(
											__(
												'Editing template. Changes made here affect all posts and pages that use the template.'
											),
											{
												type: 'snackbar',
											}
										);
									} }
								>
									{ __( 'Edit' ) }
								</Button>
							),
						}
					) }
				</span>
			) }
			{ isEditing && (
				<span className="edit-post-post-template__value">
					{ template.post_title }
				</span>
			) }
		</PanelRow>
	);
}

export default PostTemplate;
