/**
 * External dependencies
 */
import { pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	MenuGroup,
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

function DeleteTemplateConfirm( props ) {
	return props.showConfirmDialog ? (
		<ConfirmDialog
			onConfirm={ props.onConfirm }
			onCancel={ props.confirmStateResetHandler }
		>
			{ sprintf(
				/* translators: %s: template name */
				__(
					'Are you sure you want to delete the %s template? It may be used by other pages or posts.'
				),
				props.templateTitle
			) }
		</ConfirmDialog>
	) : null;
}

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
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	if ( ! template || ! template.wp_id ) {
		return null;
	}
	let templateTitle = template.slug;
	if ( template?.title ) {
		templateTitle = template.title;
	}

	const confirmStateResetHandler = () => {
		setShowConfirmDialog( false );
	};

	const onDelete = () => {
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
		deleteEntityRecord( 'postType', 'wp_template', template.id );
	};

	return (
		<MenuGroup className="edit-post-template-top-area__second-menu-group">
			<>
				<MenuItem
					className="edit-post-template-top-area__delete-template-button"
					isDestructive
					variant="secondary"
					aria-label={ __( 'Delete template' ) }
					onClick={ () => {
						setShowConfirmDialog( true );
					} }
				>
					{ __( 'Delete template' ) }
				</MenuItem>
				<DeleteTemplateConfirm
					showConfirmDialog={ showConfirmDialog }
					confirmStateResetHandler={ confirmStateResetHandler }
					templateTitle={ templateTitle }
					onConfirm={ onDelete }
				/>
			</>
		</MenuGroup>
	);
}
