/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';
import TemplateChangeModal from './change-modal';

function PostTemplate() {
	const { template, isEditing, isFSETheme } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPostType,
			getCurrentPost,
		} = select( editorStore );
		const { __experimentalGetTemplateForLink, getPostType } = select(
			coreStore
		);
		const { isEditingTemplate } = select( editPostStore );
		const link = getEditedPostAttribute( 'link' );
		const isFSEEnabled = select( editorStore ).getEditorSettings()
			.isFSETheme;
		const isViewable =
			getPostType( getCurrentPostType() )?.viewable ?? false;
		return {
			template:
				isFSEEnabled &&
				isViewable &&
				link &&
				getCurrentPost().status !== 'auto-draft'
					? __experimentalGetTemplateForLink( link )
					: null,
			isEditing: isEditingTemplate(),
			isFSETheme: isFSEEnabled,
		};
	}, [] );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ isChangingTemplate, setIsChangingTemplate ] = useState( false );

	if ( ! isFSETheme || ! template ) {
		return null;
	}

	return (
		<>
			<PanelRow className="edit-post-post-template">
				<span>{ __( 'Template' ) }</span>
				{ ! isEditing && (
					<span className="edit-post-post-template__value">
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Template name. */
								__(
									'%s (<edit>Edit</edit> | <change>Change</change>)'
								),
								template.slug
							),
							{
								edit: (
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
								change: (
									<Button
										isLink
										onClick={ () => {
											setIsChangingTemplate( true );
										} }
									>
										{ __( 'Change' ) }
									</Button>
								),
							}
						) }
					</span>
				) }
				{ isEditing && (
					<span className="edit-post-post-template__value">
						{ template.slug }
					</span>
				) }
			</PanelRow>
			{ isChangingTemplate && (
				<TemplateChangeModal
					onClose={ () => setIsChangingTemplate( false ) }
				/>
			) }
		</>
	);
}

export default PostTemplate;
