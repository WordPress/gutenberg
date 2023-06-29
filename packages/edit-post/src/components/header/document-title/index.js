/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	VisuallyHidden,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { layout, chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

function DocumentTitle() {
	const { template, isEditing } = useSelect( ( select ) => {
		const { isEditingTemplate, getEditedPostTemplate } =
			select( editPostStore );
		const _isEditing = isEditingTemplate();

		return {
			template: _isEditing ? getEditedPostTemplate() : null,
			isEditing: _isEditing,
		};
	}, [] );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	const { open: openCommandCenter } = useDispatch( commandsStore );

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
		<div className="edit-post-document-title">
			<Button
				className="edit-post-document-title__back"
				onClick={ () => {
					clearSelectedBlock();
					setIsEditingTemplate( false );
				} }
				icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
			>
				{ __( 'Back' ) }
			</Button>
			<Button
				className="edit-post-document-title__title"
				onClick={ () => openCommandCenter() }
			>
				<HStack spacing={ 1 } justify="center">
					<BlockIcon icon={ layout } />
					<Text size="body" as="h1">
						<VisuallyHidden as="span">
							{ __( 'Editing template: ' ) }
						</VisuallyHidden>
						{ templateTitle }
					</Text>
				</HStack>
				<span className="edit-post-document-title__shortcut">
					{ displayShortcut.primary( 'k' ) }
				</span>
			</Button>
		</div>
	);
}

export default DocumentTitle;
