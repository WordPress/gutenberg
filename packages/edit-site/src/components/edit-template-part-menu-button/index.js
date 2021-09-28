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
			const { theme, slug } = block.attributes;

			return select( coreStore ).getEntityRecord(
				'postType',
				'wp_template_part',
				// Ideally this should be an official public API.
				`${ theme }//${ slug }`
			);
		}
	}, [] );
	const { pushTemplatePart } = useDispatch( editSiteStore );

	if ( ! selectedTemplatePart ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						pushTemplatePart( selectedTemplatePart.id );
						onClose();
					} }
				>
					{
						/* translators: %s: template part title */
						sprintf( __( 'Edit %s' ), selectedTemplatePart.slug )
					}
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
