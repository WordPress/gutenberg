/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const { replaceBlocks } = useDispatch( 'core/block-editor' );

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
