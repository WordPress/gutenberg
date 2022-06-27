/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import { store as blockEditorStore } from '../../store';

export default function BlockInvalidWarning( { blockTitle, icon, clientId } ) {
	const accessibilityLabel = sprintf(
		/* translators: accessibility text for blocks with invalid content. %d: localized block title */
		__( '%s block. This block has invalid content' ),
		blockTitle
	);

	const selector = ( select ) => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );
		return {
			block,
		};
	};

	const { block } = useSelect( selector, [ clientId ] );

	const { replaceBlock } = useDispatch( blockEditorStore );

	const recoverBlock = ( { name, attributes, innerBlocks } ) =>
		createBlock( name, attributes, innerBlocks );

	const attemptBlockRecovery = () => {
		replaceBlock( block.clientId, recoverBlock( block ) );
	};

	attemptBlockRecovery();

	return (
		<Warning
			title={ blockTitle }
			message={ __( 'Problem displaying block' ) }
			icon={ icon }
			accessible={ true }
			accessibilityLabel={ accessibilityLabel }
		/>
	);
}
