/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockIcon } from '@wordpress/block-editor';
import {
	Button,
	VisuallyHidden,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { layout } from '@wordpress/icons';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../../private-apis';
import { store as editPostStore } from '../../../store';

const { store: commandsStore } = unlock( commandsPrivateApis );

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
		<Button
			className="edit-post-document-title"
			onClick={ () => openCommandCenter() }
		>
			<span className="edit-post-document-title__left"></span>
			<HStack
				spacing={ 1 }
				justify="center"
				className="edit-post-document-title__title"
			>
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
	);
}

export default DocumentTitle;
