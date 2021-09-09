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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function EditTemplatePartMenuButton() {
	const selectedTemplatePartId = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlock } = select(
			blockEditorStore
		);
		const selectedBlockClientId = getSelectedBlockClientId();
		const block = getBlock( selectedBlockClientId );

		if ( isTemplatePart( block ) ) {
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
			return templatePart?.id;
		}
	}, [] );
	const { setTemplatePart } = useDispatch( editSiteStore );

	if ( ! selectedTemplatePartId ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						setTemplatePart( selectedTemplatePartId );
						onClose();
					} }
				>
					{ __( 'Edit template part' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
