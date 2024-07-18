/**
 * External dependencies
 */
import { TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import { store as blockEditorStore } from '../../store';

export default function BlockInvalidWarning( { clientId } ) {
	const selector = ( select ) => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );
		const { name } = block || {};

		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType?.title;
		const blockIcon = blockType?.icon;

		return {
			block,
			blockTitle: title,
			icon: blockIcon,
		};
	};

	const { block, blockTitle, icon } = useSelect( selector, [ clientId ] );

	const accessibilityLabel = sprintf(
		/* translators: accessibility text for blocks with invalid content. %d: localized block title */
		__( '%s block. This block has invalid content' ),
		blockTitle
	);

	const { replaceBlock } = useDispatch( blockEditorStore );

	const recoverBlock = ( { name, attributes, innerBlocks } ) =>
		createBlock( name, attributes, innerBlocks );

	const attemptBlockRecovery = () => {
		replaceBlock( block.clientId, recoverBlock( block ) );
	};

	return (
		<TouchableWithoutFeedback
			onPress={ attemptBlockRecovery }
			accessible
			accessibilityRole="button"
		>
			<Warning
				title={ blockTitle }
				// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
				message={ __(
					'Problem displaying block. \nTap to attempt block recovery.'
				) }
				icon={ icon }
				accessibilityLabel={ accessibilityLabel }
			/>
		</TouchableWithoutFeedback>
	);
}
