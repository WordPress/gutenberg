/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	BlockSettingsMenuControls,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { MenuItem } from '@wordpress/components';
import { isTemplatePart } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function EditTemplatePartMenuButton() {
	const selectedTemplatePart = useSelect( ( select ) => {
		const block = select( blockEditorStore ).getSelectedBlock();

		if ( block && isTemplatePart( block ) ) {
			const templateParts =
				select( coreStore ).getEntityRecords(
					'postType',
					'wp_template_part'
				) || [];

			const templatePart = templateParts.find(
				( part ) =>
					part.theme === block.attributes.theme &&
					part.slug === block.attributes.slug
			);
			return templatePart;
		}
	}, [] );
	const { setTemplatePart } = useDispatch( editSiteStore );

	if ( ! selectedTemplatePart ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						setTemplatePart( selectedTemplatePart.id );
						onClose();
					} }
				>
					{
						/* translators: %s: template part title */
						sprintf( __( 'Edit "%s"' ), selectedTemplatePart.slug )
					}
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
