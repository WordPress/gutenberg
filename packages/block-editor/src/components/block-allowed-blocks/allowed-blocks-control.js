/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
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
			const _blockTypes = select( blocksStore ).getBlockTypes();
			const { getBlockAttributes } = select( blockEditorStore );
			return {
				blockTypes: _blockTypes.filter(
					( blockType ) =>
						hasBlockSupport( blockType, 'inserter', true ) &&
						( ! blockType.parent ||
							blockType.parent.includes( 'core/post-content' ) )
				),
				selectedBlockNames:
					getBlockAttributes( clientId )?.allowedBlocks,
			};
		},
		[ clientId ]
	);

	if ( ! blockTypes ) {
		return null;
	}

	const selectedBlockTypes =
		selectedBlockNames === undefined
			? blockTypes
			: blockTypes.filter( ( { name } ) =>
					selectedBlockNames.includes( name )
			  );

	return (
		<>
			<MenuItem
				onClick={ () => {
					setIsBlockControlOpened( true );
				} }
				aria-expanded={ isBlockControlOpened }
				aria-haspopup="dialog"
			>
				{ __( 'Manage allowed blocks' ) }
			</MenuItem>
			{ isBlockControlOpened && (
				<BlockAllowedBlocksModal
					clientId={ clientId }
					blockTypes={ blockTypes }
					selectedBlockTypes={ selectedBlockTypes }
					onClose={ () => setIsBlockControlOpened( false ) }
				/>
			) }
		</>
	);
}
