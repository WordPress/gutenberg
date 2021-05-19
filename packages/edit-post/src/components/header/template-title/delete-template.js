/**
 * External dependencies
 */
import { pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function DeleteTemplate() {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const { getEditorSettings } = useSelect( editorStore );
	const { updateEditorSettings, editPost } = useDispatch( editorStore );
	const { deleteEntityRecord } = useDispatch( coreStore );
	const { template } = useSelect( ( select ) => {
		const { isEditingTemplate, getEditedPostTemplate } = select(
			editPostStore
		);
		const _isEditing = isEditingTemplate();
		return {
			template: _isEditing ? getEditedPostTemplate() : null,
		};
	}, [] );

	if ( ! template || ! template.wp_id ) {
		return null;
	}
	return (
		<MenuGroup className="edit-post-template-top-area__second-menu-group">
			<MenuItem
				isDestructive
				isTertiary
				isLink
				aria-label = { __( 'Delete template' ) }
				onClick={ () => {
					if (
						// eslint-disable-next-line no-alert
						window.confirm(
							__(
								'Are you sure you want to delete this template? It may be currently in use by other pages or posts.'
							)
						)
					) {
						clearSelectedBlock();
						setIsEditingTemplate( false );

						editPost( {
							template: '',
						} );
						const settings = getEditorSettings();
						const newAvailableTemplates = pickBy(
							settings.availableTemplates,
							( _title, id ) => {
								return id !== template.slug;
							}
						);
						updateEditorSettings( {
							...settings,
							availableTemplates: newAvailableTemplates,
						} );
						deleteEntityRecord(
							'postType',
							'wp_template',
							template.id
						);
					}
				} }
			>
				{ __( 'Delete' ) }
			</MenuItem>
		</MenuGroup>
	);
}
