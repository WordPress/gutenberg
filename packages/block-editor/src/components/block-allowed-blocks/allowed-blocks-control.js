/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockAllowedBlocksModal from './modal';
import { store as blockEditorStore } from '../../store';

export default function BlockAllowedBlocksControl( { clientId } ) {
	const [ isBlockControlOpened, setIsBlockControlOpened ] = useState( false );
	const { blockTypes, selectedBlockNames } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return {
				blockTypes: select( blocksStore ).getBlockTypes(),
				selectedBlockNames:
					getBlockAttributes( clientId )?.allowedBlocks,
			};
		},
		[ clientId ]
	);

	const filteredBlockTypes = blockTypes.filter(
		( blockType ) =>
			hasBlockSupport( blockType, 'inserter', true ) &&
			( ! blockType.parent ||
				blockType.parent.includes( 'core/post-content' ) )
	);

	if ( ! filteredBlockTypes ) {
		return null;
	}

	const selectedBlockTypes =
		selectedBlockNames === undefined
			? filteredBlockTypes
			: filteredBlockTypes.filter( ( blockType ) =>
					selectedBlockNames.includes( blockType.name )
			  );

	return (
		<div className="block-editor-block-allowed-blocks-control">
			<BaseControl
				help={ __(
					'Specify which blocks are allowed inside this container.'
				) }
				__nextHasNoMarginBottom
			>
				<BaseControl.VisualLabel>
					{ __( 'Allowed Blocks' ) }
				</BaseControl.VisualLabel>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => {
						setIsBlockControlOpened( true );
					} }
					className="block-editor-block-allowed-blocks-control__button"
				>
					{ __( 'Manage allowed blocks' ) }
				</Button>
			</BaseControl>
			{ isBlockControlOpened && (
				<BlockAllowedBlocksModal
					clientId={ clientId }
					blockTypes={ filteredBlockTypes }
					selectedBlockTypes={ selectedBlockTypes }
					onClose={ () => setIsBlockControlOpened( false ) }
				/>
			) }
		</div>
	);
}
