/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
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

	// Avoid transforming a single `core/template-part` block.
	if ( blocks.length === 1 && blocks[ 0 ]?.name === 'core/template-part' ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						replaceBlocks(
							clientIds,
							createBlock(
								'core/template-part',
								{},
								blocks.map( ( block ) =>
									createBlock(
										block.name,
										block.attributes,
										block.innerBlocks
									)
								)
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
