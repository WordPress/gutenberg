/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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
import { useLocation } from '../routes';
import { useLink } from '../routes/link';

export default function EditTemplatePartMenuButton() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => (
				<EditTemplatePartMenuItem
					selectedClientId={ selectedClientIds[ 0 ] }
					onClose={ onClose }
				/>
			) }
		</BlockSettingsMenuControls>
	);
}

function EditTemplatePartMenuItem( { selectedClientId, onClose } ) {
	const { params } = useLocation();
	const selectedTemplatePart = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock(
				selectedClientId
			);

			if ( block && isTemplatePart( block ) ) {
				const { theme, slug } = block.attributes;

				return select( coreStore ).getEntityRecord(
					'postType',
					'wp_template_part',
					// Ideally this should be an official public API.
					`${ theme }//${ slug }`
				);
			}
		},
		[ selectedClientId ]
	);

	const linkProps = useLink(
		{
			postId: selectedTemplatePart?.id,
			postType: selectedTemplatePart?.type,
		},
		{
			fromTemplateId: params.postId,
		}
	);

	if ( ! selectedTemplatePart ) {
		return null;
	}

	return (
		<MenuItem
			{ ...linkProps }
			onClick={ ( event ) => {
				linkProps.onClick( event );
				onClose();
			} }
		>
			{
				/* translators: %s: template part title */
				sprintf( __( 'Edit %s' ), selectedTemplatePart.slug )
			}
		</MenuItem>
	);
}
