/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockAllowedBlocksModal from './modal';
import { store as blockEditorStore } from '../../store';

export default function BlockAllowedBlocksControl( { clientId } ) {
	const [ isBlockControlOpened, setIsBlockControlOpened ] = useState( false );
	const instanceId = useInstanceId(
		BlockAllowedBlocksControl,
		'allowed-blocks-control'
	);

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
			? blockTypes
			: blockTypes.filter( ( { name } ) =>
					selectedBlockNames.includes( name )
			  );

	return (
		<div className="block-editor-block-allowed-blocks-control">
			<BaseControl
				id={ instanceId }
				label={ __( 'Allowed Blocks' ) }
				help={ __(
					'Specify which blocks are allowed inside this container.'
				) }
				__nextHasNoMarginBottom
			>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => {
						setIsBlockControlOpened( true );
					} }
					className="block-editor-block-allowed-blocks-control__button"
				>
					{ __( 'Manage' ) }
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
