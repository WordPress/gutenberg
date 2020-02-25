/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { switchToBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function TemplatePartConverter() {
	const { clientIds, blocks } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds, getBlocksByClientId } = select(
			'core/block-editor'
		);
		const selectedBlockClientIds = getSelectedBlockClientIds();
		return {
			clientIds: selectedBlockClientIds,
			blocks: getBlocksByClientId( selectedBlockClientIds ),
		};
	} );
	const { replaceBlocks } = useDispatch( 'core/block-editor' );
	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						replaceBlocks(
							clientIds,
							switchToBlockType(
								blocks,
								'core/template-part',
								true
							)
						);
						onClose();
					} }
				>
					{ __( 'Make template part' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
