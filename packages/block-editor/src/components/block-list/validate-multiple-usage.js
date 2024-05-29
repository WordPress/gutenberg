/**
 * WordPress dependencies
 */
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Warning from '../warning';

/**
 * Recursively find very first block of an specific block type.
 *
 * @param {Object[]} blocks List of blocks.
 * @param {string}   name   Block name to search.
 *
 * @return {Object|undefined} Return block object or undefined.
 */
function findFirstOfSameType( blocks, name ) {
	if ( ! Array.isArray( blocks ) || ! blocks.length ) {
		return;
	}

	for ( const block of blocks ) {
		if ( block.name === name ) {
			return block;
		}

		// Search inside innerBlocks.
		const firstBlock = findFirstOfSameType( block.innerBlocks, name );

		if ( firstBlock ) {
			return firstBlock;
		}
	}
}

export function useOriginalBlockOnlyUseOnce( clientId ) {
	return useSelect( ( select ) => {
		const { getBlockName } = select( blockEditorStore );
		const blockName = getBlockName( clientId );
		const multiple = hasBlockSupport( blockName, 'multiple', true );

		// For block types with `multiple` support, there is no "original
		// block" to be found in the content, as the block itself is valid.
		if ( multiple ) {
			return false;
		}

		// Otherwise, only pass `originalBlockClientId` if it refers to a different
		// block from the current one.
		const blocks = select( blockEditorStore ).getBlocks();
		const firstOfSameType = findFirstOfSameType( blocks, blockName );
		const isInvalid =
			firstOfSameType && firstOfSameType.clientId !== clientId;
		return isInvalid ? firstOfSameType.clientId : false;
	} );
}

export function MultipleUsageWarning( {
	originalBlockClientId,
	name,
	onReplace,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockType = getBlockType( name );

	return (
		<Warning
			actions={ [
				<Button
					key="find-original"
					variant="secondary"
					onClick={ () => selectBlock( originalBlockClientId ) }
				>
					{ __( 'Find original' ) }
				</Button>,
				<Button
					key="remove"
					variant="secondary"
					onClick={ () => onReplace( [] ) }
				>
					{ __( 'Remove' ) }
				</Button>,
			] }
		>
			<strong>{ blockType?.title }: </strong>
			{ __( 'This block can only be used once.' ) }
		</Warning>
	);
}
