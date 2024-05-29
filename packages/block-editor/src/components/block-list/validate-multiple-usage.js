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

export function useOriginalBlockOnlyUseOnce( clientId ) {
	return useSelect( ( select ) => {
		const { getBlockName, getBlocksByName } = select( blockEditorStore );
		const blockName = getBlockName( clientId );
		const multiple = hasBlockSupport( blockName, 'multiple', true );

		// For block types with `multiple` support, there is no "original
		// block" to be found in the content, as the block itself is valid.
		if ( multiple ) {
			return false;
		}
		const blocksWithSameName = getBlocksByName( blockName );
		const isInvalid =
			blocksWithSameName.length && blocksWithSameName[ 0 ] !== clientId;
		return isInvalid ? blocksWithSameName[ 0 ] : false;
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
